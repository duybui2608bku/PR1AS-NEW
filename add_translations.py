import json

# Add profileSetup translation to all language files
files = [
    (r'e:\PR1AS\messages\en.json', "Profile Setup"),
    (r'e:\PR1AS\messages\vi.json', "Thiết lập hồ sơ"),
    (r'e:\PR1AS\messages\ko.json', "프로필 설정"),
]

for file_path, translation in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Add profileSetup to header.userMenu
    if 'header' in data and 'userMenu' in data['header']:
        data['header']['userMenu']['profileSetup'] = translation
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Added profileSetup translation to {file_path.split('\\')[-1]}")

print("\n✅ All translation files updated!")
