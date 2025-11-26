import json
import sys

def merge_categories(file_path):
    """Merge categories in home section of translation files"""
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # New categories to add
    new_categories = {
        "assistance": {
            "personal": {
                "name": "Personal Assistant" if 'en.json' in file_path else ("개인 비서" if 'ko.json' in file_path else "Trợ lý cá nhân"),
                "description": "Professional personal assistant services to help with daily tasks and organization" if 'en.json' in file_path else ("일상 업무 및 조직화를 돕는 전문 개인 비서 서비스" if 'ko.json' in file_path else "Dịch vụ trợ lý cá nhân chuyên nghiệp hỗ trợ các công việc hàng ngày")
            },
            "onsite": {
                "name": "On-site Assistant" if 'en.json' in file_path else ("현장 어시스턴트" if 'ko.json' in file_path else "Trợ lý tại chỗ"),
                "description": "On-site assistance for events, meetings, and special occasions" if 'en.json' in file_path else ("이벤트, 회의 및 특별한 행사를 위한 현장 지원 서비스" if 'ko.json' in file_path else "Hỗ trợ tại chỗ cho sự kiện, cuộc họp và những dịp đặc biệt")
            },
            "remote": {
                "name": "Remote Assistant" if 'en.json' in file_path else ("원격 어시스턴트" if 'ko.json' in file_path else "Trợ lý từ xa"),
                "description": "Virtual assistance services for remote work and online tasks" if 'en.json' in file_path else ("원격 근무 및 온라인 작업을 위한 가상 지원 서비스" if 'ko.json' in file_path else "Dịch vụ hỗ trợ ảo cho làm việc từ xa và công việc trực tuyến")
            },
            "tourGuide": {
                "name": "Tour Guide" if 'en.json' in file_path else ("관광 가이드" if 'ko.json' in file_path else "Hướng dẫn viên du lịch"),
                "description": "Professional tour guide services for local and international destinations" if 'en.json' in file_path else ("국내 및 해외 목적지를 위한 전문 관광 가이드 서비스" if 'ko.json' in file_path else "Dịch vụ hướng dẫn du lịch chuyên nghiệp cho các điểm đến trong và ngoài nước")
            },
            "interpreter": {
                "name": "Interpreter" if 'en.json' in file_path else ("통역사" if 'ko.json' in file_path else "Phiên dịch viên"),
                "description": "Professional interpretation services for business and personal needs" if 'en.json' in file_path else ("비즈니스 및 개인 요구를 위한 전문 통역 서비스" if 'ko.json' in file_path else "Dịch vụ phiên dịch chuyên nghiệp cho nhu cầu công việc và cá nhân")
            }
        },
        "companionship": {
            "level1": {
                "name": "Companionship - Level 1" if 'en.json' in file_path else ("동행 서비스 - 레벨 1" if 'ko.json' in file_path else "Đồng hành - Cấp 1"),
                "description": "Basic companionship services including conversation and social activities" if 'en.json' in file_path else ("대화 및 사교 활동을 포함한 기본 동행 서비스" if 'ko.json' in file_path else "Dịch vụ đồng hành cơ bản bao gồm trò chuyện và các hoạt động xã hội")
            },
            "level2": {
                "name": "Companionship - Level 2" if 'en.json' in file_path else ("동행 서비스 - 레벨 2" if 'ko.json' in file_path else "Đồng hành - Cấp 2"),
                "description": "Enhanced companionship with personalized attention and activities" if 'en.json' in file_path else ("맞춤형 관심과 활동이 포함된 향상된 동행 서비스" if 'ko.json' in file_path else "Đồng hành nâng cao với sự quan tâm và hoạt động được cá nhân hóa")
            },
            "level3": {
                "name": "Companionship - Level 3" if 'en.json' in file_path else ("동행 서비스 - 레벨 3" if 'ko.json' in file_path else "Đồng hành - Cấp 3"),
                "description": "Premium companionship services with comprehensive support" if 'en.json' in file_path else ("종합적인 지원이 포함된 프리미엄 동행 서비스" if 'ko.json' in file_path else "Dịch vụ đồng hành cao cấp với hỗ trợ toàn diện")
            }
        }
    }
    
    # Add to home.categories.items if home section exists
    if 'home' in data and 'categories' in data['home'] and 'items' in data['home']['categories']:
        # Merge new categories with existing ones
        data['home']['categories']['items'].update(new_categories)
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Updated {file_path}")

if __name__ == "__main__":
    files = [
        r"e:\PR1AS\messages\en.json",
        r"e:\PR1AS\messages\vi.json",
        r"e:\PR1AS\messages\ko.json"
    ]
    
    for file_path in files:
        try:
            merge_categories(file_path)
        except Exception as e:
            print(f"❌ Error processing {file_path}: {e}")
