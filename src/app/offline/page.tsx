export default function OfflinePage() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>اتصال اینترنت برقرار نیست</h1>
        <p style={{ opacity: 0.7, marginTop: "0.5rem" }}>
          وقتی دوباره آنلاین شدی، این صفحه رو رفرش کن.
        </p>
      </div>
    </div>
  );
}
