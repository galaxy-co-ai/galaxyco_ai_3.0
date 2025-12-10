#!/bin/bash
# Safe documentation reorganization script

echo "Starting documentation reorganization..."

# Phase files
mv PHASE_*.md docs/phases/ 2>/dev/null
echo "✓ Moved phase files"

# Handoff documents
mv HANDOFF*.md docs/archive/ 2>/dev/null
echo "✓ Moved handoff files"

# Session/historical documents
mv SESSION*.md BUILD-PROGRESS.md ASSESSMENT_AND_PLAN.md COMPREHENSIVE_ASSESSMENT_AND_HANDOFF.md docs/archive/ 2>/dev/null
echo "✓ Moved session files"

# Audit reports
mv *AUDIT*.md ENV_*.md docs/audits/ 2>/dev/null
echo "✓ Moved audit files"

# Neptune documents
mv NEPTUNE*.md FLOATING*.md docs/archive/ 2>/dev/null
echo "✓ Moved Neptune historical docs"

# Dashboard documents
mv DASHBOARD*.md docs/archive/ 2>/dev/null
echo "✓ Moved dashboard docs"

# Implementation/progress docs
mv IMPLEMENTATION*.md CRM_IMPLEMENTATION*.md SITE_ASSESSMENT.md FEATURE_AUDIT_REPORT.md TECHNICAL_DEBT_REPORT.md docs/archive/ 2>/dev/null
echo "✓ Moved implementation docs"

# Active guides (keep these accessible)
mv API_DOCUMENTATION.md DESIGN-SYSTEM.md ARTICLE_STUDIO_GUIDE.md docs/guides/ 2>/dev/null
mv PRODUCTION*.md FINAL_LAUNCH_CHECKLIST.md docs/guides/ 2>/dev/null
echo "✓ Moved active guides"

# Specs
mv API_WIRING_ASSESSMENT.md PROTOTYPE-ANALYSIS.md docs/specs/ 2>/dev/null
echo "✓ Moved specs"

# Move to potential delete folder
mv "Figma Make Project" _to-delete/ 2>/dev/null
mv components/ _to-delete/ 2>/dev/null
mv lib/ _to-delete/ 2>/dev/null
mv styles/ _to-delete/ 2>/dev/null
mv dev-server-output.txt _to-delete/ 2>/dev/null
echo "✓ Moved potentially deletable items to _to-delete/"

echo "Done! Check if site still works, then delete _to-delete/ folder."

