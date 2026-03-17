import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Link,
  Hr,
} from "@react-email/components";
import * as React from "react";

type AIPost = {
  id: string;
  original_title: string;
  original_url: string;
  ai_summary: string;
  category: string;
  source_name?: string;
};

interface NewsletterTemplateProps {
  posts: AIPost[];
  language?: "en" | "he";
  uid: string;
  baseUrl?: string;
}

export const NewsletterTemplate = ({
  posts,
  language = "en",
  uid,
  baseUrl = "http://localhost:3000",
}: NewsletterTemplateProps) => {
  const isRTL = language === "he";

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={title}>
              {isRTL ? "🗞️ עדכון ה-AI היומי שלך" : "🗞️ Your Daily AI Update"}
            </Heading>
            <Text style={subtitle}>
              {isRTL 
                ? "הנה כותרות ה-AI המובילות שאספנו עבורך היום." 
                : "Here are the top AI headlines aggregated for you today."}
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={{ direction: isRTL ? "rtl" : "ltr" }}>
            {posts.map((post) => (
              <Section key={post.id} style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={badge}>{post.category}</span>
                  <span style={source}>{post.source_name}</span>
                </div>
                
                <Heading style={cardTitle}>
                  {post.original_title}
                </Heading>
                
                <Text style={cardSummary}>
                  {post.ai_summary}
                </Text>

                <Link href={post.original_url} style={button}>
                  {isRTL ? "קרא עוד ←" : "Read More →"}
                </Link>
              </Section>
            ))}
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              Sent by AI Hub. You received this because you enabled email newsletters.
            </Text>
            <Link href={`${baseUrl}/api/newsletter/unsubscribe?uid=${uid}`} style={unsubscribeLink}>
              {isRTL ? "להסרת הרשמה" : "Unsubscribe"}
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: "#f8fafc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
};

const container = {
  margin: "40px auto",
  padding: "20px",
  width: "600px",
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
};

const header = {
  textAlign: "center" as const,
  paddingBottom: "10px",
};

const title = {
  fontSize: "24px",
  fontWeight: "800",
  color: "#1e293b",
  marginBottom: "4px",
};

const subtitle = {
  fontSize: "14px",
  color: "#64748b",
  margin: "0",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "20px 0",
};

const card = {
  padding: "16px",
  marginBottom: "16px",
  borderRadius: "12px",
  border: "1px solid #f1f5f9",
  backgroundColor: "#ffffff",
};

const badge = {
  fontSize: "10px",
  fontWeight: "bold",
  background: "#e0f2fe",
  color: "#0284c7",
  padding: "2px 8px",
  borderRadius: "9999px",
  marginRight: "8px",
};

const source = {
  fontSize: "11px",
  color: "#94a3b8",
  fontWeight: "500",
};

const cardTitle = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#0f172a",
  margin: "8px 0 4px 0",
};

const cardSummary = {
  fontSize: "13px",
  color: "#475569",
  lineHeight: "1.5",
  marginBottom: "12px",
};

const button = {
  display: "inline-block",
  fontSize: "12px",
  fontWeight: "bold",
  color: "#4f46e5",
  textDecoration: "none",
};

const footer = {
  textAlign: "center" as const,
  paddingTop: "20px",
};

const footerText = {
  fontSize: "11px",
  color: "#94a3b8",
  marginBottom: "4px",
};

const unsubscribeLink = {
  fontSize: "11px",
  color: "#4f46e5",
  textDecoration: "underline",
};
