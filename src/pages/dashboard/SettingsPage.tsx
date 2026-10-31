import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ExternalLink, Upload, Image as ImageIcon, Pencil } from "lucide-react";
import { EditMemberDialog } from "@/components/dashboard/EditMemberDialog";
import { useClinicSettings, useUpdateClinicSettings, type SiteSettings } from "@/hooks/useClinicSettings";
import { useNotificationPreferences, useUpsertNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { useOrgMembers, useUpdateOrgMemberRole, useRemoveOrgMember } from "@/hooks/useOrgMembers";
import { useClinicChairs, useCreateClinicChair, useUpdateClinicChair, useDeleteClinicChair } from "@/hooks/useClinicChairs";
import { useOrg } from "@/hooks/useOrg";
import { useAuth } from "@/hooks/useAuth";
import { getRoleLabel } from "@/config/roleAccess";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const orgRoles = ["owner", "admin", "dentist", "assistant", "hygienist", "receptionist", "accountant", "lab_technician"] as const;

export default function SettingsPage() {
  const { currentOrg } = useOrg();
  const { roles: platformRoles } = useAuth();
  const isAdmin = currentOrg?.role === "owner" || (currentOrg?.role === "admin" || currentOrg?.role === "manager");
  const canManageAdmins = currentOrg?.role === "owner" || platformRoles.includes("super_admin");

  // Clinic settings
  const { data: clinicSettings } = useClinicSettings();
  const updateClinic = useUpdateClinicSettings();
  const [clinicForm, setClinicForm] = useState<Record<string, string>>({});

  // Site customization
  const [siteForm, setSiteForm] = useState<SiteSettings>({});
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getClinicValue = (key: string) => clinicForm[key] ?? (clinicSettings as any)?.[key] ?? "";
  const getSiteValue = (key: keyof SiteSettings) => siteForm[key] ?? (clinicSettings?.settings as any)?.[key] ?? "";

  const handleSaveClinic = () => {
    if (!clinicSettings) return;
    updateClinic.mutate({ id: clinicSettings.id, ...clinicForm });
  };

  const handleSaveSite = () => {
    if (!clinicSettings) return;
    const merged: SiteSettings = {
      ...(clinicSettings.settings || {}),
      ...siteForm,
    };
    updateClinic.mutate({ id: clinicSettings.id, settings: merged });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !clinicSettings) return;

    setLogoUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${clinicSettings.id}/logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("clinic-logos")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("clinic-logos")
        .getPublicUrl(path);

      const logoUrl = urlData.publicUrl + "?t=" + Date.now();

      await updateClinic.mutateAsync({ id: clinicSettings.id, logo_url: logoUrl });
      toast({ title: "Logo uploaded successfully" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setLogoUploading(false);
    }
  };

  const publicSiteUrl = clinicSettings?.slug
    ? `${window.location.origin}/site/${clinicSettings.slug}`
    : "";

  // Notification preferences
  const { data: notifPrefs } = useNotificationPreferences();
  const upsertPrefs = useUpsertNotificationPreferences();

  const handleTogglePref = (key: string, value: boolean) => {
    upsertPrefs.mutate({ [key]: value });
  };

  // Org members
  const { data: members = [] } = useOrgMembers();
  const [editMemberUserId, setEditMemberUserId] = useState<string | null>(null);
  const updateMemberRole = useUpdateOrgMemberRole();
  const removeMember = useRemoveOrgMember();
  const [editMemberId, setEditMemberId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>("");

  // Chairs
  const { data: chairs = [] } = useClinicChairs();
  const createChair = useCreateClinicChair();
  const deleteChair = useDeleteClinicChair();
  const [newChairName, setNewChairName] = useState("");
  const [newChairRoom, setNewChairRoom] = useState("");

  const handleUpdateRole = () => {
    if (!editMemberId || !newRole) return;
    updateMemberRole.mutate({ memberId: editMemberId, role: newRole });
    setEditMemberId(null);
    setNewRole("");
  };

  const notifItems = [
    { key: "appointment_reminders", label: "Appointment Reminders", desc: "Send reminders before appointments" },
    { key: "payment_alerts", label: "Payment Alerts", desc: "Notify on overdue payments" },
    { key: "lab_completion_alerts", label: "Lab Completion Alerts", desc: "Notify when lab work is ready" },
    { key: "low_stock_alerts", label: "Low Stock Alerts", desc: "Alert when inventory is low" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage clinic profile and preferences"
        tutorial={{
          title: "Settings — How to Use",
          description: "Configure your clinic's profile, branding, working hours, and system preferences.",
          steps: [
            {
              title: "Clinic Information",
              description: "Update your clinic's name, address, phone number, email, and website. This information appears on invoices, prescriptions, and your public website.",
              tip: "Keep contact details accurate — patients see these on printed documents.",
            },
            {
              title: "Upload your clinic logo",
              description: "Click the logo upload area to add your clinic logo. It will appear on invoices, the dashboard header, and your public clinic website.",
            },
            {
              title: "Working hours",
              description: "Set the clinic's operating hours for each day of the week. These are used to suggest appointment slots and restrict bookings to clinic hours only.",
            },
            {
              title: "Notification preferences",
              description: "Configure which events trigger notifications (new appointments, payments received, low inventory) and who receives them (admin, dentist, receptionist).",
            },
            {
              title: "Save all changes",
              description: "Always click 'Save' after making any changes. Settings do not auto-save — unsaved changes will be lost if you navigate away.",
            },
          ],
          nextPageHint: {
            label: "Staff Management",
            description: "After configuring clinic settings, make sure staff accounts and roles are set up correctly on the Staff page.",
          },
        }}
      />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Tabs defaultValue="clinic">
          <TabsList className="bg-muted/50 backdrop-blur-sm">
            <TabsTrigger value="clinic">Clinic Profile</TabsTrigger>
            {isAdmin && <TabsTrigger value="website">Public Website</TabsTrigger>}
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            {isAdmin && <TabsTrigger value="members">Members & Roles</TabsTrigger>}
            {isAdmin && <TabsTrigger value="chairs">Chairs</TabsTrigger>}
          </TabsList>

          <TabsContent value="clinic" className="mt-4">
            <Card className="glass-card">
              <CardHeader className="border-b border-border/30">
                <CardTitle className="text-base">Clinic Information</CardTitle>
                <CardDescription>Update your clinic details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-lg pt-6">
                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Clinic Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-muted/50 border border-border/40 flex items-center justify-center overflow-hidden">
                      {clinicSettings?.logo_url ? (
                        <img src={clinicSettings.logo_url} alt="Logo" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border/50"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={logoUploading || !isAdmin}
                      >
                        <Upload className="mr-2 h-3.5 w-3.5" />
                        {logoUploading ? "Uploading..." : "Upload Logo"}
                      </Button>
                      <p className="text-[10px] text-muted-foreground mt-1">Recommended: 200×200px, PNG or JPG</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinicName" className="text-xs font-medium">Clinic Name</Label>
                  <Input id="clinicName" className="bg-muted/30 border-border/40" value={getClinicValue("name")} onChange={(e) => setClinicForm({ ...clinicForm, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-xs font-medium">Address</Label>
                  <Input id="address" className="bg-muted/30 border-border/40" value={getClinicValue("address")} onChange={(e) => setClinicForm({ ...clinicForm, address: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs font-medium">Phone</Label>
                    <Input id="phone" className="bg-muted/30 border-border/40" value={getClinicValue("phone")} onChange={(e) => setClinicForm({ ...clinicForm, phone: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                    <Input id="email" className="bg-muted/30 border-border/40" value={getClinicValue("email")} onChange={(e) => setClinicForm({ ...clinicForm, email: e.target.value })} />
                  </div>
                </div>
                <Button className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20" onClick={handleSaveClinic} disabled={updateClinic.isPending || !isAdmin}>
                  {updateClinic.isPending ? "Saving..." : "Save Changes"}
                </Button>
                {!isAdmin && <p className="text-xs text-muted-foreground">Only clinic owners and admins can update settings</p>}
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="website" className="mt-4 space-y-4">
              {/* Public Site Link */}
              <Card className="glass-card border-secondary/20">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Your Public Clinic Page</p>
                    <p className="text-xs text-muted-foreground mt-0.5 break-all">{publicSiteUrl || "Loading..."}</p>
                  </div>
                  {publicSiteUrl && (
                    <Button variant="outline" size="sm" className="shrink-0 border-border/50" asChild>
                      <a href={publicSiteUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-3.5 w-3.5" /> View Site
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Customization */}
              <Card className="glass-card">
                <CardHeader className="border-b border-border/30">
                  <CardTitle className="text-base">Customize Your Page</CardTitle>
                  <CardDescription>Control how your public booking page looks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-w-lg pt-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Welcome Text</Label>
                    <Textarea
                      className="bg-muted/30 border-border/40 min-h-[80px]"
                      placeholder="Welcome to our clinic! Book your appointment today."
                      value={getSiteValue("welcome_text")}
                      onChange={(e) => setSiteForm({ ...siteForm, welcome_text: e.target.value })}
                    />
                    <p className="text-[10px] text-muted-foreground">Shown below your clinic name on the public page</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Primary Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          className="h-8 w-8 rounded border border-border/40 cursor-pointer"
                          value={getSiteValue("primary_color") || "#2563eb"}
                          onChange={(e) => setSiteForm({ ...siteForm, primary_color: e.target.value })}
                        />
                        <Input
                          className="bg-muted/30 border-border/40 flex-1"
                          value={getSiteValue("primary_color") || "#2563eb"}
                          onChange={(e) => setSiteForm({ ...siteForm, primary_color: e.target.value })}
                          placeholder="#2563eb"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Accent Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          className="h-8 w-8 rounded border border-border/40 cursor-pointer"
                          value={getSiteValue("accent_color") || "#1d4ed8"}
                          onChange={(e) => setSiteForm({ ...siteForm, accent_color: e.target.value })}
                        />
                        <Input
                          className="bg-muted/30 border-border/40 flex-1"
                          value={getSiteValue("accent_color") || "#1d4ed8"}
                          onChange={(e) => setSiteForm({ ...siteForm, accent_color: e.target.value })}
                          placeholder="#1d4ed8"
                        />
                      </div>
                    </div>
                  </div>

                  <Button className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20" onClick={handleSaveSite} disabled={updateClinic.isPending}>
                    {updateClinic.isPending ? "Saving..." : "Save Site Settings"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="notifications" className="mt-4">
            <Card className="glass-card">
              <CardHeader className="border-b border-border/30">
                <CardTitle className="text-base">Notification Preferences</CardTitle>
                <CardDescription>Control what alerts you receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 max-w-lg pt-4">
                {notifItems.map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch
                      checked={notifPrefs ? (notifPrefs as any)[item.key] : true}
                      onCheckedChange={(checked) => handleTogglePref(item.key, checked)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="members" className="mt-4">
              <Card className="glass-card">
                <CardHeader className="border-b border-border/30">
                  <CardTitle className="text-base">Clinic Members</CardTitle>
                  <CardDescription>Manage roles for members of this clinic</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {members.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">No members found.</p>
                    ) : (
                      members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card/50 hover:bg-accent/20 transition-colors">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{member.full_name}</p>
                            <Badge variant="secondary" className="text-[10px] mt-1 bg-secondary/10 text-secondary border-secondary/20">
                              {getRoleLabel(member.role)}
                            </Badge>
                          </div>
                          {editMemberId === member.id ? (
                            <div className="flex items-center gap-2">
                              <Select value={newRole} onValueChange={setNewRole}>
                                <SelectTrigger className="w-36 h-8 text-xs bg-muted/30"><SelectValue placeholder="Select role" /></SelectTrigger>
                                <SelectContent>
                                  {orgRoles.filter((r) => r !== member.role && (canManageAdmins || (r !== "owner" && r !== "admin"))).map((r) => (
                                    <SelectItem key={r} value={r} className="capitalize text-xs">{getRoleLabel(r)}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button size="sm" className="h-8 text-xs bg-secondary hover:bg-secondary/90" onClick={handleUpdateRole} disabled={!newRole}>
                                Save
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setEditMemberId(null)}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                             <div className="flex items-center gap-2">
                               {(canManageAdmins || !["owner", "admin"].includes(member.role)) && (
                                 <Button variant="outline" size="sm" className="h-8 text-xs border-border/50" onClick={() => setEditMemberUserId(member.user_id)}>
                                   <Pencil className="h-3 w-3 mr-1" /> Edit Details
                                 </Button>
                               )}
                               <Button variant="outline" size="sm" className="h-8 text-xs border-border/50" onClick={() => { setEditMemberId(member.id); setNewRole(""); }}>
                                 Change Role
                               </Button>
                              {member.role !== "owner" && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => removeMember.mutate(member.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="chairs" className="mt-4">
              <Card className="glass-card">
                <CardHeader className="border-b border-border/30">
                  <CardTitle className="text-base">Chair / Operatory Management</CardTitle>
                  <CardDescription>Configure clinic chairs and rooms</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex gap-3 items-end">
                    <div className="space-y-1 flex-1">
                      <Label className="text-xs">Chair Name</Label>
                      <Input placeholder="e.g. Chair 4" value={newChairName} onChange={e => setNewChairName(e.target.value)} className="bg-muted/30" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <Label className="text-xs">Room</Label>
                      <Input placeholder="e.g. Room C" value={newChairRoom} onChange={e => setNewChairRoom(e.target.value)} className="bg-muted/30" />
                    </div>
                    <Button className="bg-secondary hover:bg-secondary/90" disabled={!newChairName || createChair.isPending} onClick={() => {
                      createChair.mutate({ name: newChairName, room: newChairRoom }, {
                        onSuccess: () => { setNewChairName(""); setNewChairRoom(""); },
                      });
                    }}>
                      <Plus className="mr-1 h-4 w-4" /> Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {chairs.map((chair: any) => (
                      <div key={chair.id} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card/50">
                        <div>
                          <p className="text-sm font-medium">{chair.name}</p>
                          <p className="text-xs text-muted-foreground">{chair.room || "No room"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={chair.status === "active" ? "default" : "secondary"} className="text-[10px]">{chair.status}</Badge>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteChair.mutate(chair.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </motion.div>

      <EditMemberDialog
        userId={editMemberUserId}
        open={!!editMemberUserId}
        onOpenChange={(open) => !open && setEditMemberUserId(null)}
      />
    </div>
  );
}
