import re

# Read the file
with open(r'e:\PR1AS\components\layout\Header.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the button section (lines 124-133)
old_button = '''            <Button
              type="text"
              style={{
                fontWeight: 500,
                color: "#222",
                borderRadius: "22px",
              }}
            >
              {t("header.becomeWorker")}
            </Button>'''

new_button = '''            {/* Only show "Become Worker" button if user is logged in and is a client */}
            {isAuthenticated && userRole === "client" && (
              <Button
                type="text"
                style={{
                  fontWeight: 500,
                  color: "#222",
                  borderRadius:  "22px",
                }}
                onClick={() => router.push("/worker/setup")}
              >
                {t("header.becomeWorker")}
              </Button>
            )}'''

# Replace
content = content.replace(old_button, new_button)

# Write back
with open(r'e:\PR1AS\components\layout\Header.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Header.tsx updated successfully!")
