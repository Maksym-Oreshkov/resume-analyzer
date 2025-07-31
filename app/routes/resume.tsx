import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import ATS from "~/components/ATS";
import Details from "~/components/Details";
import Summary from "~/components/Summary";
import { usePuterStore } from "~/lib/puter";
import AnimatedGradient from "~/ui/AnimatedGradient";

export const meta = () => [
  { title: "Resumatic | Auth" },
  { name: "description", content: "Detailed overview of your resume" },
];

const Resume = () => {
  const { auth, isLoading, fs, kv } = usePuterStore();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [imageUrl, setImageUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated)
      navigate(`/auth?next=/resume/${id}`);
  }, [isLoading]);

  useEffect(() => {
    const loadResume = async () => {
      try {
        setIsLoadingData(true);
        const resume = await kv.get(`resume:${id}`);

        if (!resume) {
          setError("Resume not found");
          setIsLoadingData(false);
          return;
        }

        const data = JSON.parse(resume);

        if (data.error) {
          setError(data.error);
          setTimeout(() => {
            navigate("/");
          }, 5000);
        }

        const resumeBlob = await fs.read(data.resumePath);
        if (!resumeBlob) {
          setError("Failed to load resume file");
          setIsLoadingData(false);
          return;
        }

        const pdfBlob = new Blob([resumeBlob], { type: "application/pdf" });
        const resumeUrl = URL.createObjectURL(pdfBlob);
        setResumeUrl(resumeUrl);

        const imageBlob = await fs.read(data.imagePath);
        if (!imageBlob) {
          setError("Failed to load resume preview");
          setIsLoadingData(false);
          return;
        }

        const imageUrl = URL.createObjectURL(imageBlob);
        setImageUrl(imageUrl);

        if (!data.error && data.feedback) {
          setFeedback(data.feedback);
        }

        setIsLoadingData(false);
      } catch (err: any) {
        console.error("Error loading resume:", err);
        setError("Failed to load resume data");
        setIsLoadingData(false);
      }
    };

    loadResume();
  }, [id]);

  useEffect(() => {
    if (searchParams.get("error") === "true" && !error) {
      setError("AI analysis failed. You may have exceeded your usage limit.");
    }
  }, [searchParams]);

  return (
    <main className="!pt-0">
      <AnimatedGradient />
      <nav className="resume-nav">
        <Link to="/" className="back-button">
          <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
          <span className="text-gray-800 text-sm font-semibold">
            Back to Homepage
          </span>
        </Link>
      </nav>

      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full px-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg shadow-lg">
            <p className="font-semibold text-lg mb-1">Error</p>
            <p className="mb-2">{error}</p>
            <p className="text-sm opacity-75">
              Redirecting to homepage in 5 seconds...
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-row w-full max-lg:flex-col-reverse">
        <section className="feedback-section bg-[url('/images/bg-small.svg') bg-cover h-[100vh] sticky top-0 items-center justify-center">
          {imageUrl && resumeUrl && (
            <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit">
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={imageUrl}
                  className="w-full h-full object-contain rounded-2xl"
                  title="resume"
                />
              </a>
            </div>
          )}
        </section>
        <section className="feedback-section">
          <h2 className="text-4xl !text-black font-bold">Resume Review</h2>

          {isLoadingData ? (
            <img src="/images/resume-scan-2.gif" className="w-full" />
          ) : feedback ? (
            <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
              <Summary feedback={feedback} />
              <ATS
                score={feedback.ATS.score || 0}
                suggestions={feedback.ATS.tips || []}
              />
              <Details feedback={feedback} />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16">
              <img
                src="/icons/error.svg"
                alt="error"
                className="w-24 h-24 mb-4 opacity-50"
              />
              <p className="text-gray-600 text-center max-w-md">
                We couldn't analyze your resume at this time.
                {error.includes("limit") &&
                  " You may have reached your usage limit."}
              </p>
              <Link to="/" className="primary-button mt-6">
                Try Again
              </Link>
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-600">No feedback available</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default Resume;
