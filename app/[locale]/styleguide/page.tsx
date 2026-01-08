"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { Badge, MedalBadge } from "@/components/ui/Badge";
import { Avatar, AvatarWithStatus } from "@/components/ui/Avatar";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card variant="surface" padding="lg" className="mb-8">
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ColorSwatch({ name, color, textColor = "white" }: { name: string; color: string; textColor?: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="w-20 h-20 rounded-lg border border-glass-border flex items-center justify-center text-xs font-mono"
        style={{ backgroundColor: color, color: textColor }}
      >
        {color}
      </div>
      <span className="text-sm text-text-muted">{name}</span>
    </div>
  );
}

export default function StyleguidePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || "de";
  const isSuperAdmin = session?.user?.isSuperAdmin ?? false;

  const [toggleStates, setToggleStates] = useState({
    sm: false,
    md: true,
    lg: false,
  });

  const [floatingValue, setFloatingValue] = useState("");
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !isSuperAdmin) {
      router.push(`/${locale}`);
    }
  }, [session, status, isSuperAdmin, router, locale]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-text-primary mb-2">Styleguide</h1>
        <p className="text-text-muted mb-8">GeoMaster World Design System</p>

        {/* Colors */}
        <Section title="Colors">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-text-secondary mb-4">Primary</h3>
              <div className="flex flex-wrap gap-4">
                <ColorSwatch name="primary" color="#00D9FF" textColor="black" />
                <ColorSwatch name="primary-light" color="#5CE6FF" textColor="black" />
                <ColorSwatch name="primary-dark" color="#00A8C6" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-text-secondary mb-4">Accent</h3>
              <div className="flex flex-wrap gap-4">
                <ColorSwatch name="accent" color="#FF6B35" />
                <ColorSwatch name="accent-light" color="#FF8F66" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-text-secondary mb-4">Semantic</h3>
              <div className="flex flex-wrap gap-4">
                <ColorSwatch name="success" color="#00FF88" textColor="black" />
                <ColorSwatch name="error" color="#FF3366" />
                <ColorSwatch name="warning" color="#FF6B35" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-text-secondary mb-4">Surfaces</h3>
              <div className="flex flex-wrap gap-4">
                <ColorSwatch name="background" color="#0F1419" />
                <ColorSwatch name="surface-1" color="#1A1F26" />
                <ColorSwatch name="surface-2" color="#242B35" />
                <ColorSwatch name="surface-3" color="#2E3744" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-text-secondary mb-4">Text</h3>
              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-20 h-20 rounded-lg border border-glass-border bg-surface-2 flex items-center justify-center">
                    <span className="text-text-primary font-bold">Aa</span>
                  </div>
                  <span className="text-sm text-text-muted">primary</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-20 h-20 rounded-lg border border-glass-border bg-surface-2 flex items-center justify-center">
                    <span className="text-text-secondary font-bold">Aa</span>
                  </div>
                  <span className="text-sm text-text-muted">secondary</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-20 h-20 rounded-lg border border-glass-border bg-surface-2 flex items-center justify-center">
                    <span className="text-text-muted font-bold">Aa</span>
                  </div>
                  <span className="text-sm text-text-muted">muted</span>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Typography */}
        <Section title="Typography">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-text-secondary mb-4">Headings (Montserrat)</h3>
              <div className="space-y-3">
                <div className="flex items-baseline gap-4">
                  <span className="text-text-muted text-sm w-20">display</span>
                  <span className="text-display">Display Text</span>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-text-muted text-sm w-20">h1</span>
                  <h1 className="text-h1">Heading 1</h1>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-text-muted text-sm w-20">h2</span>
                  <h2 className="text-h2">Heading 2</h2>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-text-muted text-sm w-20">h3</span>
                  <h3 className="text-h3">Heading 3</h3>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-text-secondary mb-4">Body (Open Sans)</h3>
              <div className="space-y-3">
                <div className="flex items-baseline gap-4">
                  <span className="text-text-muted text-sm w-20">body</span>
                  <span className="text-body">Body text for main content</span>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-text-muted text-sm w-20">body-small</span>
                  <span className="text-body-small">Smaller body text</span>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-text-muted text-sm w-20">caption</span>
                  <span className="text-caption">Caption text</span>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-text-muted text-sm w-20">label</span>
                  <span className="text-label">Label Text</span>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Buttons */}
        <Section title="Buttons">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-text-secondary mb-4">Variants</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="accent">Accent</Button>
                <Button variant="success">Success</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="glass">Glass</Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-text-secondary mb-4">Sizes</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" size="sm">Small</Button>
                <Button variant="primary" size="md">Medium</Button>
                <Button variant="primary" size="lg">Large</Button>
                <Button variant="primary" size="xl">XL</Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-text-secondary mb-4">Icon Buttons</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" size="icon-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </Button>
                <Button variant="primary" size="icon">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </Button>
                <Button variant="primary" size="icon-lg">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-text-secondary mb-4">States</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Default</Button>
                <Button variant="primary" isLoading>Loading</Button>
                <Button variant="primary" disabled>Disabled</Button>
              </div>
            </div>
          </div>
        </Section>

        {/* Cards */}
        <Section title="Cards">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card variant="surface" padding="md">
              <CardContent>
                <p className="text-text-secondary">Surface</p>
              </CardContent>
            </Card>
            <Card variant="elevated" padding="md">
              <CardContent>
                <p className="text-text-secondary">Elevated</p>
              </CardContent>
            </Card>
            <Card variant="glass" padding="md">
              <CardContent>
                <p className="text-text-secondary">Glass</p>
              </CardContent>
            </Card>
            <Card variant="glass-elevated" padding="md">
              <CardContent>
                <p className="text-text-secondary">Glass Elevated</p>
              </CardContent>
            </Card>
            <Card variant="interactive" padding="md">
              <CardContent>
                <p className="text-text-secondary">Interactive (hover me)</p>
              </CardContent>
            </Card>
            <Card variant="highlight" padding="md">
              <CardContent>
                <p className="text-text-secondary">Highlight</p>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* Inputs */}
        <Section title="Inputs">
          <div className="space-y-6 max-w-md">
            <div>
              <h3 className="text-lg font-semibold text-text-secondary mb-4">Sizes</h3>
              <div className="space-y-3">
                <Input size="sm" placeholder="Small input" />
                <Input size="md" placeholder="Medium input" />
                <Input size="lg" placeholder="Large input" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-text-secondary mb-4">Variants</h3>
              <div className="space-y-3">
                <Input placeholder="Default" />
                <Input variant="error" placeholder="Error state" />
                <Input variant="success" placeholder="Success state" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-text-secondary mb-4">Floating Input</h3>
              <FloatingInput
                id="demo"
                label="Floating Label"
                value={floatingValue}
                onChange={(e) => setFloatingValue(e.target.value)}
              />
            </div>
          </div>
        </Section>

        {/* Badges */}
        <Section title="Badges">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-text-secondary mb-4">Variants</h3>
              <div className="flex flex-wrap gap-3">
                <Badge variant="default">Default</Badge>
                <Badge variant="primary">Primary</Badge>
                <Badge variant="accent">Accent</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="error">Error</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-text-secondary mb-4">Sizes</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="primary" size="sm">Small</Badge>
                <Badge variant="primary" size="md">Medium</Badge>
                <Badge variant="primary" size="lg">Large</Badge>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-text-secondary mb-4">Medal Badges</h3>
              <div className="flex gap-3">
                <MedalBadge position={1} />
                <MedalBadge position={2} />
                <MedalBadge position={3} />
              </div>
            </div>
          </div>
        </Section>

        {/* Avatars */}
        <Section title="Avatars">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-text-secondary mb-4">Sizes</h3>
              <div className="flex items-end gap-4">
                <Avatar size="sm" name="John Doe" />
                <Avatar size="md" name="John Doe" />
                <Avatar size="lg" name="John Doe" />
                <Avatar size="xl" name="John Doe" />
                <Avatar size="2xl" name="John Doe" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-text-secondary mb-4">With Image</h3>
              <div className="flex items-end gap-4">
                <Avatar size="lg" name="User" src="https://i.pravatar.cc/150?img=1" />
                <Avatar size="lg" name="User" src="https://i.pravatar.cc/150?img=2" />
                <Avatar size="lg" name="User" src="https://i.pravatar.cc/150?img=3" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-text-secondary mb-4">Status Indicators</h3>
              <div className="flex items-end gap-4">
                <AvatarWithStatus size="lg" name="Online" status="online" />
                <AvatarWithStatus size="lg" name="Offline" status="offline" />
                <AvatarWithStatus size="lg" name="Away" status="away" />
                <AvatarWithStatus size="lg" name="Ready" status="ready" />
              </div>
            </div>
          </div>
        </Section>

        {/* Toggle Switch */}
        <Section title="Toggle Switch">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-text-secondary mb-4">Sizes</h3>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <ToggleSwitch
                    size="sm"
                    checked={toggleStates.sm}
                    onChange={() => setToggleStates({ ...toggleStates, sm: !toggleStates.sm })}
                  />
                  <span className="text-text-muted text-sm">Small</span>
                </div>
                <div className="flex items-center gap-2">
                  <ToggleSwitch
                    size="md"
                    checked={toggleStates.md}
                    onChange={() => setToggleStates({ ...toggleStates, md: !toggleStates.md })}
                  />
                  <span className="text-text-muted text-sm">Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <ToggleSwitch
                    size="lg"
                    checked={toggleStates.lg}
                    onChange={() => setToggleStates({ ...toggleStates, lg: !toggleStates.lg })}
                  />
                  <span className="text-text-muted text-sm">Large</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-text-secondary mb-4">Disabled</h3>
              <div className="flex items-center gap-6">
                <ToggleSwitch checked={false} disabled onChange={() => {}} />
                <ToggleSwitch checked={true} disabled onChange={() => {}} />
              </div>
            </div>
          </div>
        </Section>

        {/* Glass & Surface Effects */}
        <Section title="Glass & Surface Effects">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card p-6 rounded-lg">
              <p className="text-text-secondary">.glass-card</p>
            </div>
            <div className="glass-card-elevated p-6 rounded-lg">
              <p className="text-text-secondary">.glass-card-elevated</p>
            </div>
            <div className="surface-card p-6 rounded-lg">
              <p className="text-text-secondary">.surface-card</p>
            </div>
            <div className="surface-card-elevated p-6 rounded-lg">
              <p className="text-text-secondary">.surface-card-elevated</p>
            </div>
          </div>
        </Section>

        {/* Glow Effects */}
        <Section title="Glow Effects">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-text-secondary mb-4">Box Glows</h3>
              <div className="flex flex-wrap gap-6">
                <div className="w-20 h-20 bg-surface-2 rounded-lg glow-primary flex items-center justify-center">
                  <span className="text-xs text-text-muted">primary</span>
                </div>
                <div className="w-20 h-20 bg-surface-2 rounded-lg glow-primary-lg flex items-center justify-center">
                  <span className="text-xs text-text-muted">primary-lg</span>
                </div>
                <div className="w-20 h-20 bg-surface-2 rounded-lg glow-accent flex items-center justify-center">
                  <span className="text-xs text-text-muted">accent</span>
                </div>
                <div className="w-20 h-20 bg-surface-2 rounded-lg glow-success flex items-center justify-center">
                  <span className="text-xs text-text-muted">success</span>
                </div>
                <div className="w-20 h-20 bg-surface-2 rounded-lg glow-error flex items-center justify-center">
                  <span className="text-xs text-text-muted">error</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-text-secondary mb-4">Text Glows</h3>
              <div className="flex flex-wrap gap-6">
                <span className="text-2xl font-bold text-primary text-glow-primary">Primary</span>
                <span className="text-2xl font-bold text-success text-glow-success">Success</span>
                <span className="text-2xl font-bold text-error text-glow-error">Error</span>
                <span className="text-2xl font-bold text-accent text-glow-accent">Accent</span>
              </div>
            </div>
          </div>
        </Section>

        {/* Animations */}
        <Section title="Animations">
          <div className="space-y-6">
            <Button variant="secondary" onClick={() => setAnimationKey((k) => k + 1)}>
              Replay Animations
            </Button>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" key={animationKey}>
              <div className="p-4 bg-surface-2 rounded-lg animate-fade-in">
                <p className="text-text-secondary text-sm">fade-in</p>
              </div>
              <div className="p-4 bg-surface-2 rounded-lg animate-slide-up">
                <p className="text-text-secondary text-sm">slide-up</p>
              </div>
              <div className="p-4 bg-surface-2 rounded-lg animate-card-entrance">
                <p className="text-text-secondary text-sm">card-entrance</p>
              </div>
              <div className="p-4 bg-surface-2 rounded-lg animate-score-pop">
                <p className="text-text-secondary text-sm">score-pop</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-text-secondary mb-4">Continuous</h3>
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-primary rounded-full animate-pulse-ring" />
                <div className="p-4 bg-surface-2 rounded-lg animate-shake">
                  <p className="text-text-secondary text-sm">shake</p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Spacing */}
        <Section title="Spacing">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-text-muted text-sm w-16">xs (4px)</span>
              <div className="h-4 bg-primary" style={{ width: "4px" }} />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-text-muted text-sm w-16">sm (8px)</span>
              <div className="h-4 bg-primary" style={{ width: "8px" }} />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-text-muted text-sm w-16">md (16px)</span>
              <div className="h-4 bg-primary" style={{ width: "16px" }} />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-text-muted text-sm w-16">lg (24px)</span>
              <div className="h-4 bg-primary" style={{ width: "24px" }} />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-text-muted text-sm w-16">xl (32px)</span>
              <div className="h-4 bg-primary" style={{ width: "32px" }} />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-text-muted text-sm w-16">2xl (48px)</span>
              <div className="h-4 bg-primary" style={{ width: "48px" }} />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-text-muted text-sm w-16">3xl (64px)</span>
              <div className="h-4 bg-primary" style={{ width: "64px" }} />
            </div>
          </div>
        </Section>

        {/* Border Radius */}
        <Section title="Border Radius">
          <div className="flex flex-wrap gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 bg-primary" style={{ borderRadius: "4px" }} />
              <span className="text-sm text-text-muted">sm (4px)</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 bg-primary" style={{ borderRadius: "8px" }} />
              <span className="text-sm text-text-muted">md (8px)</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 bg-primary" style={{ borderRadius: "12px" }} />
              <span className="text-sm text-text-muted">lg (12px)</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 bg-primary" style={{ borderRadius: "16px" }} />
              <span className="text-sm text-text-muted">xl (16px)</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 bg-primary" style={{ borderRadius: "24px" }} />
              <span className="text-sm text-text-muted">2xl (24px)</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 bg-primary rounded-full" />
              <span className="text-sm text-text-muted">full</span>
            </div>
          </div>
        </Section>
      </main>
    </div>
  );
}
