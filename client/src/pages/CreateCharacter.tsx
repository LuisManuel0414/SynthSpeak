import { Sidebar } from "@/components/Sidebar";
import { useCreateCharacter } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Loader2, Image as ImageIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCharacterSchema, type InsertCharacter } from "@shared/routes";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Pre-defined avatars for quick selection
const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop", // Male 1
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop", // Female 1
  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop", // Male 2
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop", // Female 2
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&h=150&fit=crop", // Male 3
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop", // Female 3
];

export default function CreateCharacter() {
  const [, setLocation] = useLocation();
  const { mutate: createCharacter, isPending } = useCreateCharacter();
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  const form = useForm<InsertCharacter>({
    resolver: zodResolver(insertCharacterSchema),
    defaultValues: {
      name: "",
      persona: "",
      greeting: "Hello! I'm ready to chat with you.",
      avatarUrl: "",
    },
  });

  const onSubmit = (data: InsertCharacter) => {
    createCharacter(data, {
      onSuccess: () => setLocation("/new-chat"),
    });
  };

  const handleAvatarSelect = (url: string) => {
    setSelectedAvatar(url);
    form.setValue("avatarUrl", url);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar className="hidden md:flex w-80 lg:w-96 flex-shrink-0" />
      
      <div className="flex-1 overflow-y-auto bg-background/50">
        <div className="max-w-3xl mx-auto p-4 md:p-8 lg:p-12 animate-fade-in">
          <Link href="/new-chat">
            <Button variant="ghost" size="sm" className="mb-6 -ml-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to selection
            </Button>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Create Persona</h1>
            <p className="text-muted-foreground">Define the personality and traits of your AI character.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
            <div className="space-y-6">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card className="border-border/50 shadow-sm overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-primary to-purple-500" />
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-base font-semibold">Name</Label>
                      <Input 
                        id="name"
                        placeholder="e.g. Socrates, Sherlock Holmes, Coding Assistant"
                        className="h-12 text-lg"
                        {...form.register("name")}
                      />
                      {form.formState.errors.name && (
                        <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="persona" className="text-base font-semibold">Personality & Instructions</Label>
                      <Textarea 
                        id="persona"
                        placeholder="Describe how this character behaves. Be specific! e.g. 'You are a sarcastic robot from the future who loves 80s music.'"
                        className="min-h-[150px] resize-none text-base leading-relaxed"
                        {...form.register("persona")}
                      />
                      <p className="text-xs text-muted-foreground">
                        The more detailed your description, the better the AI will embody this character.
                      </p>
                      {form.formState.errors.persona && (
                        <p className="text-sm text-destructive">{form.formState.errors.persona.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="greeting" className="text-base font-semibold">First Message</Label>
                      <Input 
                        id="greeting"
                        placeholder="What should they say first?"
                        className="h-12"
                        {...form.register("greeting")}
                      />
                      {form.formState.errors.greeting && (
                        <p className="text-sm text-destructive">{form.formState.errors.greeting.message}</p>
                      )}
                    </div>

                    <input type="hidden" {...form.register("avatarUrl")} />
                  </CardContent>
                </Card>

                <div className="flex items-center justify-end gap-4">
                  <Link href="/new-chat">
                    <Button type="button" variant="ghost" size="lg">Cancel</Button>
                  </Link>
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="min-w-[150px] rounded-full shadow-lg shadow-primary/25"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Create Persona
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>

            <div className="space-y-6">
              <div className="sticky top-6">
                <Label className="text-base font-semibold mb-4 block">Choose Avatar</Label>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {AVATAR_PRESETS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAvatarSelect(url)}
                      className={cn(
                        "relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50",
                        selectedAvatar === url 
                          ? "border-primary ring-2 ring-primary/20 shadow-md" 
                          : "border-transparent hover:border-border"
                      )}
                    >
                      <img 
                        src={url} 
                        alt={`Avatar ${idx + 1}`}
                        className="w-full h-full object-cover" 
                      />
                      {selectedAvatar === url && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="bg-primary text-white rounded-full p-1">
                            <Sparkles className="h-3 w-3" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                
                <div className="bg-secondary/30 p-4 rounded-xl border border-border/50 text-sm">
                  <div className="flex items-center gap-2 mb-2 text-primary font-medium">
                    <ImageIcon className="h-4 w-4" />
                    Custom Avatar
                  </div>
                  <Input 
                    placeholder="Paste image URL..." 
                    className="h-9 text-xs bg-background"
                    value={form.watch("avatarUrl") || ""}
                    onChange={(e) => handleAvatarSelect(e.target.value)}
                  />
                </div>

                {/* Preview Card */}
                <div className="mt-8">
                  <Label className="text-xs font-semibold text-muted-foreground mb-3 block uppercase tracking-wider">Preview</Label>
                  <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-muted">
                        {form.watch("avatarUrl") ? (
                          <img src={form.watch("avatarUrl") || ""} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                            {(form.watch("name") || "A").charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{form.watch("name") || "Character Name"}</div>
                        <div className="text-[10px] text-muted-foreground">AI Persona</div>
                      </div>
                    </div>
                    <div className="bg-secondary/50 rounded-xl rounded-tl-none p-3 text-sm text-foreground/90">
                      {form.watch("greeting") || "Hello! I'm ready to chat."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
