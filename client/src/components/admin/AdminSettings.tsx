import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, Waves, Volume2, Bot, BellRing } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PushToTalkButton from './PushToTalkButton';

// Props for the voice effect button component
interface VoiceEffectButtonProps {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
  isActive: boolean;
}

// Voice effect button component
function VoiceEffectButton({ title, icon, onClick, isActive }: VoiceEffectButtonProps) {
  return (
    <Button
      variant={isActive ? "default" : "outline"}
      className={`flex items-center gap-2 ${
        isActive 
          ? 'bg-[#8B5CF6] hover:bg-[#7C3AED]' 
          : 'hover:border-[#8B5CF6]'
      }`}
      onClick={onClick}
    >
      {icon}
      <span>{title}</span>
    </Button>
  );
}

export default function AdminSettings() {
  const { toast } = useToast();
  const [selectedEffect, setSelectedEffect] = useState<string | undefined>(undefined);
  const [userId, setUserId] = useState<number | null>(null);

  // Get current user info when component mounts
  useEffect(() => {
    // Fetch current user info
    fetch('/api/auth/current')
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then(user => {
        setUserId(user.id);
      })
      .catch(err => {
        console.error("Failed to get current user:", err);
      });
  }, []);

  // Handle voice effect selection
  const selectVoiceEffect = (effect: string | undefined) => {
    // If clicking the currently selected effect, turn it off
    if (effect === selectedEffect) {
      setSelectedEffect(undefined);
      toast({
        title: "Voice Modulation Disabled",
        description: "Your voice will be transmitted normally",
      });
    } else {
      setSelectedEffect(effect);
      toast({
        title: "Voice Modulation Enabled",
        description: `Your voice will be modified with the ${effect?.replace(/([A-Z])/g, ' $1').toLowerCase() || ''} effect`,
      });
    }
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Waves className="h-5 w-5" />
          Voice Settings
        </CardTitle>
        <CardDescription>
          Customize your voice and broadcast settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Voice Effects</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <VoiceEffectButton
                title="Deep Voice"
                icon={<Volume2 className="h-4 w-4" />}
                onClick={() => selectVoiceEffect('deepVoice')}
                isActive={selectedEffect === 'deepVoice'}
              />
              <VoiceEffectButton
                title="Robot"
                icon={<Bot className="h-4 w-4" />}
                onClick={() => selectVoiceEffect('robot')}
                isActive={selectedEffect === 'robot'}
              />
              <VoiceEffectButton
                title="High Pitch"
                icon={<Mic className="h-4 w-4" />}
                onClick={() => selectVoiceEffect('highPitch')}
                isActive={selectedEffect === 'highPitch'}
              />
              <VoiceEffectButton
                title="Echo"
                icon={<BellRing className="h-4 w-4" />}
                onClick={() => selectVoiceEffect('echo')}
                isActive={selectedEffect === 'echo'}
              />
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium mb-3">Push-to-Talk with Voice Effect</h3>
            {userId ? (
              <PushToTalkButton 
                userId={userId} 
                voiceEffect={selectedEffect}
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                Loading user information...
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}