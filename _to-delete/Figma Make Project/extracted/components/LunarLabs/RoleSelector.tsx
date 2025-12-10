import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { UserCircle, Check } from 'lucide-react';

interface RoleSelectorProps {
  selectedRole: string;
  onRoleChange: (role: string) => void;
}

const roles = [
  { id: 'sales', label: 'Sales', icon: '💼', description: 'Close deals faster' },
  { id: 'support', label: 'Support', icon: '🎧', description: 'Help customers efficiently' },
  { id: 'marketing', label: 'Marketing', icon: '📈', description: 'Drive growth campaigns' },
  { id: 'operations', label: 'Operations', icon: '⚙️', description: 'Streamline processes' },
  { id: 'developer', label: 'Developer', icon: '👨‍💻', description: 'Build integrations' },
];

export function RoleSelector({ selectedRole, onRoleChange }: RoleSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const selectedRoleData = roles.find(r => r.id === selectedRole);

  return (
    <Card className="p-2.5 border-purple-500/20">
      <div 
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <UserCircle className="w-4 h-4 text-purple-400" />
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-400">Your Role</div>
          <div className="text-sm flex items-center gap-1">
            <span>{selectedRoleData?.icon}</span>
            <span className="truncate">{selectedRoleData?.label}</span>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] h-4">
          {isExpanded ? '−' : '+'}
        </Badge>
      </div>

      {isExpanded && (
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {roles.map((role) => (
            <Button
              key={role.id}
              variant={selectedRole === role.id ? 'default' : 'outline'}
              size="sm"
              className={`h-auto p-2 justify-start text-xs ${
                selectedRole === role.id 
                  ? 'bg-purple-500/20 border-purple-500' 
                  : 'border-gray-700'
              }`}
              onClick={() => {
                onRoleChange(role.id);
                setIsExpanded(false);
              }}
            >
              <span className="mr-1.5">{role.icon}</span>
              <span className="truncate">{role.label}</span>
              {selectedRole === role.id && (
                <Check className="w-3 h-3 text-purple-400 ml-auto" />
              )}
            </Button>
          ))}
        </div>
      )}
    </Card>
  );
}
