"""
Update Profile Setup route to /worker/profile/setup
"""

# 1. Update UserMenu.tsx
with open(r'e:\PR1AS\components\common\UserMenu.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('router.push("/worker/setup");', 'router.push("/worker/profile/setup");')

with open(r'e:\PR1AS\components\common\UserMenu.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ UserMenu.tsx updated - route changed to /worker/profile/setup")

# 2. Update Worker layout.tsx
with open(r'e:\PR1AS\app\worker\layout.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('getItem("Profile Setup", "/worker/setup"', 'getItem("Profile Setup", "/worker/profile/setup"')

with open(r'e:\PR1AS\app\worker\layout.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Worker layout.tsx updated - route changed to /worker/profile/setup")

# 3. Update Header.tsx (Become Worker button)
with open(r'e:\PR1AS\components\layout\Header.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('router.push("/worker/setup")', 'router.push("/worker/profile/setup")')

with open(r'e:\PR1AS\components\layout\Header.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Header.tsx updated - route changed to /worker/profile/setup")

print("\n✅ All routes updated to /worker/profile/setup!")
