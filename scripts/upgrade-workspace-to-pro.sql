-- Upgrade dalton@galaxyco.ai workspace to Professional tier
-- This will enable phone number provisioning

-- Step 1: Find the workspace for dalton@galaxyco.ai
-- Run this first to verify the workspace ID
SELECT 
    w.id,
    w.name,
    w.subscription_tier,
    wm.user_id
FROM workspaces w
JOIN workspace_members wm ON w.id = wm.workspace_id
JOIN users u ON wm.user_id = u.id
WHERE u.email = 'dalton@galaxyco.ai';

-- Step 2: Update workspace to Professional tier
-- Copy the workspace ID from Step 1 and use it below
UPDATE workspaces
SET 
    subscription_tier = 'professional',
    updated_at = NOW()
WHERE id IN (
    SELECT w.id
    FROM workspaces w
    JOIN workspace_members wm ON w.id = wm.workspace_id
    JOIN users u ON wm.user_id = u.id
    WHERE u.email = 'dalton@galaxyco.ai'
);

-- Step 3: Verify the update
SELECT 
    w.id,
    w.name,
    w.subscription_tier,
    w.updated_at
FROM workspaces w
JOIN workspace_members wm ON w.id = wm.workspace_id
JOIN users u ON wm.user_id = u.id
WHERE u.email = 'dalton@galaxyco.ai';

-- Step 4: Check if phone number was auto-provisioned
SELECT 
    wpn.id,
    wpn.workspace_id,
    wpn.phone_number,
    wpn.friendly_name,
    wpn.number_type,
    wpn.status,
    wpn.provisioned_at
FROM workspace_phone_numbers wpn
JOIN workspace_members wm ON wpn.workspace_id = wm.workspace_id
JOIN users u ON wm.user_id = u.id
WHERE u.email = 'dalton@galaxyco.ai';

-- NOTE: Auto-provisioning only happens during workspace creation via Clerk webhook
-- If no phone number exists after upgrade, manually provision one at:
-- https://galaxyco.ai/settings/phone-numbers
