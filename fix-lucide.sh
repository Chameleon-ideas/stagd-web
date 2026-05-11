#!/bin/bash
# Removes hallucinated lucide-react brand icons that don't exist in this package.
# Run this anytime after another AI edits the edit profile page.
FILE="src/app/profile/edit/page.tsx"
sed -i '' '/^  Instagram, $/d; /^  Linkedin, $/d; /^  Twitter, $/d; /^  Youtube, $/d' "$FILE"
sed -i '' 's/<Instagram size={14} \/>/<Globe size={14} \/>/g' "$FILE"
sed -i '' 's/<Linkedin size={14} \/>/<Globe size={14} \/>/g' "$FILE"
sed -i '' 's/<Twitter size={14} \/>/<Globe size={14} \/>/g' "$FILE"
sed -i '' 's/<Youtube size={14} \/>/<Globe size={14} \/>/g' "$FILE"
echo "✓ Bad lucide icons removed"
