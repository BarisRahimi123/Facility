create table if not exists public.workflow_settings (
  id bigint primary key,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert default record
insert into public.workflow_settings (id, settings)
values (1, '{
  "new": {
    "assignmentType": "internal",
    "notifyByEmail": true,
    "notifyBySMS": false,
    "additionalActions": "",
    "autoTransition": false,
    "requiredFields": ["title", "description", "priority"]
  },
  "pending_estimate": {
    "assignmentType": "external",
    "notifyByEmail": true,
    "notifyBySMS": true,
    "additionalActions": "",
    "autoTransition": true,
    "requiredFields": ["estimateForm", "deadline"]
  },
  "estimates_received": {
    "assignmentType": "internal",
    "notifyByEmail": true,
    "notifyBySMS": false,
    "additionalActions": "",
    "autoTransition": false,
    "requiredFields": ["estimateReview", "approvalStatus"]
  },
  "estimate_accepted": {
    "assignmentType": "internal",
    "notifyByEmail": true,
    "notifyBySMS": false,
    "additionalActions": "createPO",
    "autoTransition": false,
    "requiredFields": ["selectedEstimate"]
  },
  "po_issued": {
    "assignmentType": "internal",
    "notifyByEmail": true,
    "notifyBySMS": true,
    "additionalActions": "notifyVendor",
    "autoTransition": false,
    "requiredFields": ["poNumber", "approvers"],
    "approvalWorkflow": {
      "enabled": true,
      "requiredApprovals": 1,
      "escalateAfterHours": 48
    }
  }
}'::jsonb)
on conflict (id) do nothing; 