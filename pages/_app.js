// pages/_app.js
import '../styles/globals.css';// Responsive UI layout [cite: 34]
import Layout from '../components/layout'; 
import { AuthProvider } from '../lib/auth'; 

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      {/* Shared Layout (navbar/sidebar) [cite: 9] */}
      <Layout> 
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}

export default MyApp;