import React, { useState, useEffect } from 'react';
import locationData from '../data/locations.json'; 

export default function AddressSelector({ onChange, defaultValue }) {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [street, setStreet] = useState('');

  // 1. Nạp dữ liệu và Xử lý Default Value (Chạy 1 lần)
  useEffect(() => {
    setProvinces(locationData);

    // Nếu có địa chỉ cũ (defaultValue), hãy cố gắng phân tích nó
    if (defaultValue) {
        parseAddress(defaultValue, locationData);
    }
  }, [defaultValue]); // Chạy lại khi defaultValue thay đổi (lúc API tải xong)

  // Hàm phân tích địa chỉ: "Số nhà, Phường, Quận, Tỉnh" -> ID
  const parseAddress = (addressStr, data) => {
    try {
        const parts = addressStr.split(',').map(p => p.trim());
        if (parts.length < 3) return; // Không đủ thông tin

        // Lấy ngược từ cuối lên: Tỉnh -> Huyện -> Xã
        const pName = parts[parts.length - 1];
        const dName = parts[parts.length - 2];
        const wName = parts[parts.length - 3];
        
        // Phần còn lại là số nhà
        const sName = parts.slice(0, parts.length - 3).join(', ');

        // 1. Tìm Tỉnh
        const province = data.find(p => p.Name === pName || p.Name.includes(pName));
        if (province) {
            setSelectedProvince(province.Id);
            setDistricts(province.Districts);

            // 2. Tìm Huyện
            const district = province.Districts.find(d => d.Name === dName || d.Name.includes(dName));
            if (district) {
                setSelectedDistrict(district.Id);
                setWards(district.Wards);

                // 3. Tìm Xã
                const ward = district.Wards.find(w => w.Name === wName || w.Name.includes(wName));
                if (ward) {
                    setSelectedWard(ward.Id);
                }
            }
        }
        setStreet(sName);
    } catch (e) {
        console.error("Không thể tự động điền địa chỉ:", e);
    }
  };

  // 2. Xử lý khi chọn Tỉnh
  const handleProvinceChange = (e) => {
    const provinceId = e.target.value;
    setSelectedProvince(provinceId);
    
    setSelectedDistrict('');
    setSelectedWard('');
    setDistricts([]);
    setWards([]);

    const provinceData = locationData.find(p => p.Id === provinceId);
    setDistricts(provinceData ? provinceData.Districts : []);

    updateFullAddress(provinceData?.Name, '', '', street);
  };

  // 3. Xử lý khi chọn Quận/Huyện
  const handleDistrictChange = (e) => {
    const districtId = e.target.value;
    setSelectedDistrict(districtId);
    setSelectedWard('');
    
    const provinceData = locationData.find(p => p.Id === selectedProvince);
    const districtData = provinceData?.Districts.find(d => d.Id === districtId);
    setWards(districtData ? districtData.Wards : []);

    updateFullAddress(provinceData?.Name, districtData?.Name, '', street);
  };

  // 4. Xử lý khi chọn Phường/Xã
  const handleWardChange = (e) => {
    const wardId = e.target.value;
    setSelectedWard(wardId);

    const provinceData = locationData.find(p => p.Id === selectedProvince);
    const districtData = provinceData?.Districts.find(d => d.Id === selectedDistrict);
    const wardData = districtData?.Wards.find(w => w.Id === wardId);

    updateFullAddress(provinceData?.Name, districtData?.Name, wardData?.Name, street);
  };

  // 5. Nhập số nhà
  const handleStreetChange = (e) => {
    setStreet(e.target.value);
    
    const provinceData = locationData.find(p => p.Id === selectedProvince);
    const districtData = provinceData?.Districts.find(d => d.Id === selectedDistrict);
    const wardData = districtData?.Wards.find(w => w.Id === selectedWard);

    updateFullAddress(provinceData?.Name, districtData?.Name, wardData?.Name, e.target.value);
  };

  const updateFullAddress = (p, d, w, s) => {
    const parts = [];
    if (s) parts.push(s);
    if (w) parts.push(w);
    if (d) parts.push(d);
    if (p) parts.push(p);
    
    if (onChange) {
        onChange(parts.join(', '));
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Tỉnh / Thành */}
        <select 
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={selectedProvince}
            onChange={handleProvinceChange}
        >
            <option value="">-- Tỉnh/Thành --</option>
            {locationData.map(p => (
                <option key={p.Id} value={p.Id}>{p.Name}</option>
            ))}
        </select>

        {/* Quận / Huyện */}
        <select 
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
            value={selectedDistrict}
            onChange={handleDistrictChange}
            disabled={!selectedProvince}
        >
            <option value="">-- Quận/Huyện --</option>
            {districts.map(d => (
                <option key={d.Id} value={d.Id}>{d.Name}</option>
            ))}
        </select>

        {/* Phường / Xã */}
        <select 
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
            value={selectedWard}
            onChange={handleWardChange}
            disabled={!selectedDistrict}
        >
            <option value="">-- Phường/Xã --</option>
            {wards.map(w => (
                <option key={w.Id} value={w.Id}>{w.Name}</option>
            ))}
        </select>
      </div>

      <input 
        type="text" 
        placeholder="Số nhà, tên đường (Cụ thể)" 
        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        value={street}
        onChange={handleStreetChange}
      />
    </div>
  );
}