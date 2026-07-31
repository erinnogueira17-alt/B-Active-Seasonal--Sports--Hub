import { Link } from "wouter";
import { PageContainer } from "../components/ui";

export function NotFound() {
  return (
    <PageContainer>
      <div className="card mx-auto max-w-md p-10 text-center">
        <div className="heading text-5xl text-[#dc2626]">404</div>
        <p className="mt-3 text-neutral-600">That page couldn't be found.</p>
        <Link href="/" className="btn-primary mt-5">
          Back to Home
        </Link>
      </div>
    </PageContainer>
  );
}
