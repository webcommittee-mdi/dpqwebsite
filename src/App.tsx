import { lazy, Suspense } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router";
import { Layout } from "./components/Layout";
import { useTitle } from "./components/ui";
import Home from "./pages/Home";

// Pages other than the homepage load only when someone visits them.
const About = lazy(() => import("./pages/About"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Team = lazy(() => import("./pages/Team"));
const Check = lazy(() => import("./pages/Check"));

function NotFound() {
  useTitle("Page not found");
  return (
    <section className="wrap py-32">
      <h1 className="display mb-6 text-[clamp(2.4rem,5vw,4rem)]">This page doesn't exist</h1>
      <p className="lede mb-10">The link may be old or mistyped.</p>
      <Link to="/" className="btn btn-primary">
        Go to the homepage
      </Link>
    </section>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Layout>
        <Suspense fallback={<div className="min-h-[60vh]" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/team" element={<Team />} />
            <Route path="/check" element={<Check />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}
