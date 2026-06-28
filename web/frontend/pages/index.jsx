import { useState } from "react";
import { Page, Layout, Card, TextField, Button, Banner } from "@shopify/polaris";

export default function HomePage() {
  const [announcementText, setAnnouncementText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [statusText, setStatusText] = useState("");

  const handleSave = async () => {
    if (!announcementText) {
      setStatusText("Please enter some text before saving.");
      return;
    }

    setIsSaving(true);
    setStatusText("");

    try {
      const response = await fetch("/api/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: announcementText }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatusText("Success! Announcement saved to Database and Shopify.");
        setAnnouncementText("");
      } else {
        setStatusText(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Failed to save:", error);
      setStatusText("A network error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Card>
            <div style={{ padding: "2rem" }}>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
                Announcement
              </h2>

              <div style={{ marginBottom: "1rem" }}>
                <TextField
                  label="Announcement Text"
                  value={announcementText}
                  onChange={setAnnouncementText}
                  autoComplete="off"
                  placeholder="eg. Sale 50% Off"
                />
              </div>

              <Button primary loading={isSaving} onClick={handleSave}>
                Save
              </Button>

              {statusText && (
                <div style={{ marginTop: "1.5rem" }}>
                  <Banner tone={statusText.includes("Error") ? "critical" : "success"}>
                    <p>{statusText}</p>
                  </Banner>
                </div>
              )}
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}