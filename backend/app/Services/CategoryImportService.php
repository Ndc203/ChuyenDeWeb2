<?php

namespace App\Services;

use App\Models\Category;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\IOFactory;

class CategoryImportService
{
    /**
     * Parse an uploaded spreadsheet and return normalized row data with validation metadata.
     */
    public function parse(UploadedFile $file): array
    {
        $reader = IOFactory::createReaderForFile($file->getRealPath());
        $reader->setReadDataOnly(true);
        $spreadsheet = $reader->load($file->getRealPath());
        $sheet = $spreadsheet->getActiveSheet();

        $highestRow = $sheet->getHighestDataRow();
        $highestColumnIndex = Coordinate::columnIndexFromString($sheet->getHighestDataColumn());

        $columnMap = $this->buildColumnMap($sheet->rangeToArray("A1:" . $sheet->getHighestDataColumn() . "1")[0]);

        if (!isset($columnMap['name'])) {
            $spreadsheet->disconnectWorksheets();

            throw ValidationException::withMessages([
                'file' => 'File thiếu cột Name, không thể nhập dữ liệu.',
            ]);
        }

        $existing = Category::select('category_id', 'name', 'slug')
            ->get()
            ->map(fn (Category $category) => [
                'id' => $category->category_id,
                'name' => $category->name,
                'slug' => $category->slug,
                'name_key' => Str::lower($category->name),
            ]);

        $existingById = $existing->keyBy('id');
        $existingBySlug = $existing->keyBy(fn ($item) => Str::lower($item['slug']));
        $existingByName = $existing->groupBy('name_key');

        $rawRows = [];

        for ($rowIndex = 2; $rowIndex <= $highestRow; $rowIndex++) {
            $row = [];
            foreach ($columnMap as $key => $column) {
                $coordinate = Coordinate::stringFromColumnIndex($column) . $rowIndex;
                $cell = $sheet->getCell($coordinate);
                $value = $cell ? $cell->getCalculatedValue() : null;
                if (is_string($value)) {
                    $value = trim($value);
                } elseif (is_numeric($value)) {
                    $value = (string) $value;
                } else {
                    $value = $value ?? '';
                }
                $row[$key] = $value;
            }

            $isEmpty = $this->isRowEmpty($row);
            if ($isEmpty) {
                continue;
            }

            $rawRows[] = [
                'index' => $rowIndex,
                'name' => $row['name'] ?? '',
                'description' => $row['description'] ?? '',
                'status' => $row['status'] ?? '',
                'parent_name' => $row['parent_name'] ?? ($row['parent'] ?? ''),
                'parent_id' => $row['parent_id'] ?? null,
                'parent_slug' => $row['parent_slug'] ?? '',
            ];
        }

        $spreadsheet->disconnectWorksheets();

        if (!count($rawRows)) {
            return [
                'rows' => [],
                'summary' => [
                    'total' => 0,
                    'valid' => 0,
                    'invalid' => 0,
                    'duplicates_in_db' => 0,
                    'duplicates_in_file' => 0,
                ],
            ];
        }

        $nameCounts = [];
        foreach ($rawRows as $row) {
            $key = Str::lower($row['name'] ?? '');
            if ($key !== '') {
                $nameCounts[$key] = ($nameCounts[$key] ?? 0) + 1;
            }
        }

        $fileNameMap = [];
        foreach ($rawRows as $row) {
            $key = Str::lower($row['name'] ?? '');
            if ($key !== '') {
                $fileNameMap[$key][] = $row['index'];
            }
        }

        $rows = [];
        $duplicateDbCount = 0;
        $duplicateFileCount = 0;
        foreach ($rawRows as $row) {
            $errors = [];
            $name = trim((string)($row['name'] ?? ''));
            $description = trim((string)($row['description'] ?? ''));
            $status = Str::of((string)($row['status'] ?? ''))
                ->lower()
                ->trim()
                ->value();
            $status = $status !== '' ? $status : 'active';

            if (!in_array($status, ['active', 'inactive'], true)) {
                $errors[] = 'Trạng thái chỉ chấp nhận active hoặc inactive.';
            }

            if ($name === '') {
                $errors[] = 'Thiếu tên danh mục.';
            }

            $parentResolution = null;
            $rawParent = [
                'name' => $row['parent_name'] ?? '',
                'slug' => $row['parent_slug'] ?? '',
                'id' => $row['parent_id'] !== '' ? $row['parent_id'] : null,
            ];

            $normalizedParentName = Str::of((string) $rawParent['name'])
                ->trim()
                ->lower()
                ->value();

            if (in_array($normalizedParentName, ['root', 'danh muc goc', 'none', 'null', 'khong co danh muc cha'], true)) {
                $rawParent['name'] = '';
                $rawParent['slug'] = '';
                $rawParent['id'] = null;
            }

            if ($rawParent['id'] !== null && $rawParent['id'] !== '') {
                $parentId = (int) $rawParent['id'];
                if ($existingById->has($parentId)) {
                    $parentResolution = [
                        'type' => 'existing',
                        'id' => $parentId,
                        'label' => $existingById->get($parentId)['name'],
                    ];
                } else {
                    $errors[] = "Không tìm thấy danh mục cha với ID {$parentId}.";
                }
            } elseif ($rawParent['slug'] !== '') {
                $slug = Str::slug($rawParent['slug']);
                if ($existingBySlug->has(Str::lower($slug))) {
                    $match = $existingBySlug->get(Str::lower($slug));
                    $parentResolution = [
                        'type' => 'existing',
                        'id' => $match['id'],
                        'label' => $match['name'],
                    ];
                } else {
                    $errors[] = "Không tìm thấy danh mục cha với Slug {$rawParent['slug']}.";
                }
            } elseif ($rawParent['name'] !== '') {
                $parentNameKey = Str::lower($rawParent['name']);
                if ($existingByName->has($parentNameKey)) {
                    $matches = $existingByName->get($parentNameKey);
                    if ($matches->count() === 1) {
                        $match = $matches->first();
                        $parentResolution = [
                            'type' => 'existing',
                            'id' => $match['id'],
                            'label' => $match['name'],
                        ];
                    } else {
                        $errors[] = "Danh mục cha \"{$rawParent['name']}\" khớp nhiều bản ghi. Vui lòng dùng Parent ID hoặc Parent Slug.";
                    }
                } else {
                    $inFileMatches = array_filter(
                        $fileNameMap[$parentNameKey] ?? [],
                        fn ($index) => $index !== $row['index']
                    );

                    if (count($inFileMatches) === 1) {
                        $parentResolution = [
                            'type' => 'file',
                            'index' => $inFileMatches[0],
                            'label' => $rawParent['name'],
                        ];
                    } elseif (count($inFileMatches) > 1) {
                        $errors[] = "Danh mục cha \"{$rawParent['name']}\" xuất hiện nhiều dòng trong file. Vui lòng dùng Parent ID.";
                    } else {
                        $errors[] = "Không tìm thấy danh mục cha \"{$rawParent['name']}\".";
                    }
                }
            }

            $duplicateInDb = false;
            $matches = new Collection();
            if ($name !== '') {
                $matches = $existingByName->get(Str::lower($name)) ?? new Collection();
                if ($matches->count()) {
                    $duplicateDbCount++;
                    $duplicateInDb = true;
                }

                if (($nameCounts[Str::lower($name)] ?? 0) > 1) {
                    $duplicateFileCount++;
                }
            }

            $rows[] = [
                'index' => $row['index'],
                'data' => [
                    'name' => $name,
                    'description' => $description !== '' ? $description : null,
                    'status' => $status,
                    'parent_name' => $rawParent['name'] !== '' ? $rawParent['name'] : null,
                ],
                'parent' => $parentResolution,
                'existing' => $duplicateInDb
                    ? $matches->map(fn ($item) => Arr::only($item, ['id', 'name', 'slug']))->values()->all()
                    : [],
                'duplicate_in_file' => ($nameCounts[Str::lower($name)] ?? 0) > 1,
                'errors' => $errors,
                'is_valid' => !count($errors),
            ];
        }

        $valid = array_filter($rows, fn ($row) => $row['is_valid']);

        return [
            'rows' => $rows,
            'summary' => [
                'total' => count($rows),
                'valid' => count($valid),
                'invalid' => count($rows) - count($valid),
                'duplicates_in_db' => $duplicateDbCount,
                'duplicates_in_file' => $duplicateFileCount,
            ],
        ];
    }

    /**
     * Attempt to import the given rows. Returns statistics and error messages.
     */
    public function import(array $rows, ?array $selected = null): array
    {
        $indexedRows = collect($rows)->keyBy('index');

        if ($selected !== null && count($selected)) {
            $selectedIndexes = array_map('intval', $selected);
            $indexedRows = $indexedRows->filter(fn ($row, $index) => in_array((int) $index, $selectedIndexes, true));
        }

        $pending = $indexedRows->filter(fn ($row) => $row['is_valid'])->all();

        $skipped = [];
        foreach ($indexedRows as $row) {
            if (!$row['is_valid']) {
                $skipped[] = [
                    'index' => $row['index'],
                    'message' => 'Dòng có lỗi, không thể nhập.',
                    'errors' => $row['errors'],
                ];
            }
        }

        $createdMap = [];
        $created = [];
        $errors = $skipped;

        while (count($pending)) {
            $progress = false;
            foreach ($pending as $key => $row) {
                $parentId = null;
                $parent = $row['parent'];
                if ($parent === null) {
                    // no parent
                } elseif ($parent['type'] === 'existing') {
                    $parentId = $parent['id'];
                } elseif ($parent['type'] === 'file') {
                    $parentIndex = $parent['index'];
                    if (isset($createdMap[$parentIndex])) {
                        $parentId = $createdMap[$parentIndex];
                    } elseif (!isset($pending[$parentIndex])) {
                        $errors[] = [
                            'index' => $row['index'],
                            'message' => "Không thể tìm thấy danh mục cha dòng {$parentIndex} trong danh sách nhập.",
                            'errors' => ["Danh mục cha dòng {$parentIndex} không được chọn để nhập."],
                        ];
                        unset($pending[$key]);
                        continue;
                    } else {
                        continue;
                    }
                }

                try {
                    $category = Category::create([
                        'name' => $row['data']['name'],
                        'description' => $row['data']['description'],
                        'parent_id' => $parentId,
                        'status' => $row['data']['status'],
                    ]);

                    $createdMap[$row['index']] = $category->category_id;
                    $created[] = [
                        'index' => $row['index'],
                        'id' => $category->category_id,
                        'name' => $category->name,
                    ];

                    unset($pending[$key]);
                    $progress = true;
                } catch (\Throwable $exception) {
                    $errors[] = [
                        'index' => $row['index'],
                        'message' => 'Không thể tạo danh mục.',
                        'errors' => [$exception->getMessage()],
                    ];
                    unset($pending[$key]);
                }
            }

            if (!$progress) {
                foreach ($pending as $row) {
                    $errors[] = [
                        'index' => $row['index'],
                        'message' => 'Không thể xác định danh mục cha trong file. Hãy kiểm tra lại thứ tự.',
                        'errors' => ['Danh mục cha chưa được tạo ở các dòng trước.'],
                    ];
                }
                break;
            }
        }

        return [
            'created' => $created,
            'errors' => $errors,
            'summary' => [
                'inserted' => count($created),
                'failed' => count($errors),
            ],
        ];
    }

    private function buildColumnMap(array $headers): array
    {
        $map = [];
        foreach ($headers as $index => $header) {
            $normalized = $this->normalizeHeader((string) $header);
            if ($normalized === null) {
                continue;
            }

            if (!array_key_exists($normalized, $map)) {
                $map[$normalized] = $index + 1;
            }
        }

        return $map;
    }

    private function normalizeHeader(string $header): ?string
    {
        $header = trim($header);
        if ($header === '') {
            return null;
        }

        $normalized = Str::of(Str::ascii($header))
            ->lower()
            ->replaceMatches('/[^a-z0-9]+/u', '_')
            ->trim('_')
            ->value();

        return match ($normalized) {
            'name', 'ten', 'ten_danh_muc', 'category_name' => 'name',
            'description', 'mo_ta' => 'description',
            'parent', 'parent_name', 'ten_danh_muc_cha', 'parentcategory' => 'parent_name',
            'parent_id', 'id_parent', 'parentid' => 'parent_id',
            'parent_slug', 'slug_parent' => 'parent_slug',
            'status', 'trang_thai' => 'status',
            default => null,
        };
    }

    private function isRowEmpty(array $row): bool
    {
        foreach ($row as $value) {
            if (is_string($value) && trim($value) !== '') {
                return false;
            }
            if (!is_string($value) && $value !== null && $value !== '') {
                return false;
            }
        }

        return true;
    }
}
