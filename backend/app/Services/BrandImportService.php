<?php

namespace App\Services;

use App\Models\Brand;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\IOFactory;

class BrandImportService
{
    /**
     * Parse an uploaded spreadsheet and return normalized rows with diagnostics.
     */
    public function parse(UploadedFile $file): array
    {
        $reader = IOFactory::createReaderForFile($file->getRealPath());
        $reader->setReadDataOnly(true);
        $spreadsheet = $reader->load($file->getRealPath());
        $sheet = $spreadsheet->getActiveSheet();

        $highestRow = $sheet->getHighestDataRow();
        $highestColumn = $sheet->getHighestDataColumn();

        $headers = $sheet->rangeToArray("A1:{$highestColumn}1")[0];
        $columnMap = $this->buildColumnMap($headers);

        if (!isset($columnMap['name'])) {
            $spreadsheet->disconnectWorksheets();

            throw ValidationException::withMessages([
                'file' => 'File thiếu cột Name, không thể phân tích dữ liệu.',
            ]);
        }

        $existingBrands = Brand::withTrashed()
            ->select('brand_id', 'name', 'slug', 'status')
            ->get()
            ->map(fn (Brand $brand) => [
                'id' => $brand->brand_id,
                'name' => $brand->name,
                'slug' => $brand->slug,
                'status' => $brand->status,
                'name_key' => Str::lower($brand->name),
            ]);

        $existingByName = $existingBrands->groupBy('name_key');

        $rawRows = [];
        for ($rowIndex = 2; $rowIndex <= $highestRow; $rowIndex++) {
            $row = [];
            foreach ($columnMap as $key => $columnIndex) {
                $coordinate = Coordinate::stringFromColumnIndex($columnIndex) . $rowIndex;
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

            if ($this->isRowEmpty($row)) {
                continue;
            }

            $rawRows[] = [
                'index' => $rowIndex,
                'name' => $row['name'] ?? '',
                'description' => $row['description'] ?? '',
                'status' => $row['status'] ?? '',
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

        $rows = [];
        $duplicateDbCount = 0;
        $duplicateFileCount = 0;

        foreach ($rawRows as $row) {
            $errors = [];
            $name = trim((string) ($row['name'] ?? ''));
            $description = trim((string) ($row['description'] ?? ''));
            $status = Str::of((string) ($row['status'] ?? ''))
                ->lower()
                ->trim()
                ->value();
            $status = $status !== '' ? $status : 'active';

            if (!in_array($status, ['active', 'inactive'], true)) {
                $errors[] = 'Trạng thái chỉ chấp nhận active hoặc inactive.';
            }

            if ($name === '') {
                $errors[] = 'Thiếu tên thương hiệu.';
            }

            if (Str::length($description) > 255) {
                $errors[] = 'Mo ta khong duoc vuot 255 ky tu.';
            }

            $existingMatches = new Collection();
            if ($name !== '') {
                $existingMatches = $existingByName->get(Str::lower($name)) ?? new Collection();
                if ($existingMatches->count()) {
                    $duplicateDbCount++;
                    $errors[] = 'Tên thương hiệu đã tồn tại trong hệ thống.';
                }

                if (($nameCounts[Str::lower($name)] ?? 0) > 1) {
                    $duplicateFileCount++;
                    $errors[] = 'Tên thương hiệu bị trùng lặp trong file import.';
                }
            }

            $rows[] = [
                'index' => $row['index'],
                'data' => [
                    'name' => $name,
                    'description' => $description !== '' ? $description : null,
                    'status' => $status,
                ],
                'existing' => $existingMatches->count()
                    ? $existingMatches->map(fn ($item) => [
                        'id' => $item['id'],
                        'name' => $item['name'],
                        'slug' => $item['slug'],
                        'status' => $item['status'],
                    ])->values()->all()
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
     * Import the given rows (optionally filtered by selected indices).
     */
    public function import(array $rows, ?array $selected = null): array
    {
        if (!count($rows)) {
            return [
                'created' => [],
                'errors' => [],
                'summary' => [
                    'inserted' => 0,
                    'failed' => 0,
                ],
            ];
        }

        $rowsByIndex = [];
        foreach ($rows as $row) {
            $rowsByIndex[$row['index']] = $row;
        }

        $targets = $selected !== null
            ? array_values(array_intersect($selected, array_keys($rowsByIndex)))
            : array_keys($rowsByIndex);

        $created = [];
        $errors = [];

        foreach ($targets as $index) {
            $row = $rowsByIndex[$index] ?? null;
            if (!$row) {
                continue;
            }

            if (!$row['is_valid']) {
                $errors[] = [
                    'index' => $row['index'],
                    'message' => 'Dòng không hợp lệ, vui lòng kiểm tra lại dữ liệu.',
                    'errors' => $row['errors'],
                ];
                continue;
            }

            try {
                $brand = Brand::create([
                    'name' => $row['data']['name'],
                    'description' => $row['data']['description'],
                    'status' => $row['data']['status'],
                ]);

                $created[] = [
                    'index' => $row['index'],
                    'id' => $brand->brand_id,
                    'name' => $brand->name,
                    'slug' => $brand->slug,
                ];
            } catch (\Throwable $exception) {
                $errors[] = [
                    'index' => $row['index'],
                    'message' => 'Không thể tạo thương hiệu.',
                    'errors' => [$exception->getMessage()],
                ];
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
            'name', 'ten', 'ten_thuong_hieu', 'brand_name' => 'name',
            'description', 'mo_ta', 'thong_tin', 'ghi_chu' => 'description',
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


