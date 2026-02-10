import "./globals.css";

export const metadata = {
    title: "OnChain Todo",
    description: "A simple decentralized Todo dApp",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
