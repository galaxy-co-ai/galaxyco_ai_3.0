# Rollback Script (If Needed)

**Created:** December 10, 2025

If you need to undo the reorganization, run these commands:

```bash
# Move files back from docs/ to root
mv docs/phases/*.md .
mv docs/archive/*.md .
mv docs/audits/*.md .
mv docs/guides/*.md .
mv docs/specs/*.md .

# Move files back from _to-delete/
mv _to-delete/components/ .
mv _to-delete/lib/ .
mv _to-delete/styles/ .
mv "_to-delete/Figma Make Project/" .
mv _to-delete/dev-server-output.txt .

# Remove new folders
rm -rf docs/phases docs/archive docs/audits docs/guides docs/specs _to-delete

# Restore tsconfig.json
# (manually remove "_to-delete" from exclude array)
```

**Note:** You shouldn't need this - the build passed! But it's here just in case.

