import { useState, type FormEvent, useEffect } from "react";
import { useNavigate } from "react-router";
import FileUploader from "~/components/FileUploader";
import Navbar from "~/components/Navbar";
import { convertPdfToImage } from "~/lib/pdf2img";
import { usePuterStore } from "~/lib/puter";
import { generateUUID } from "~/lib/utils";
import { prepareInstructions } from "../../constants";
import AnimatedGradient from "~/ui/AnimatedGradient";

const Upload = () => {
  const { auth, isLoading, fs, ai, kv } = usePuterStore();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const isValid =
      companyName.trim() !== "" &&
      jobTitle.trim() !== "" &&
      jobDescription.trim() !== "" &&
      file !== null;

    setIsFormValid(isValid);
  }, [companyName, jobTitle, jobDescription, file]);

  const handleFileSelect = (file: File | null) => {
    setFile(file);
    // Clear any previous errors when selecting a new file
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setIsProcessing(false);
    setStatusText("");
    setCompanyName("");
    setJobTitle("");
    setJobDescription("");
    file !== null;
  };

  const handleAnalyze = async ({
    companyName,
    jobTitle,
    jobDescription,
    file,
  }: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    file: File;
  }) => {
    try {
      setIsProcessing(true);
      setError(null);

      // Upload file
      setStatusText("Uploading the file...");
      const uploadedFile = await fs.upload([file]);
      if (!uploadedFile) {
        throw new Error("Failed to upload file");
      }

      // Convert to image
      setStatusText("Converting to image...");
      const imageFile = await convertPdfToImage(file);
      if (!imageFile.file) {
        throw new Error("Failed to convert PDF to image");
      }

      // Upload image
      setStatusText("Uploading the image...");
      const uploadedImage = await fs.upload([imageFile.file]);
      if (!uploadedImage) {
        throw new Error("Failed to upload image");
      }

      // Prepare data
      setStatusText("Preparing data...");
      const uuid = generateUUID();
      const data = {
        id: uuid,
        resumePath: uploadedFile.path,
        imagePath: uploadedImage.path,
        companyName,
        jobTitle,
        jobDescription,
        feedback: "",
      };

      // Save initial data
      await kv.set(`resume:${uuid}`, JSON.stringify(data));

      // Analyze with AI
      setStatusText("Analyzing your resume...");

      try {
        const feedback = await ai.feedback(
          uploadedFile.path,
          prepareInstructions({ jobTitle, jobDescription })
        );

        if (!feedback) {
          throw new Error("Failed to analyze resume");
        }

        const feedbackText =
          typeof feedback.message.content === "string"
            ? feedback.message.content
            : feedback.message.content[0].text;

        data.feedback = JSON.parse(feedbackText);
        await kv.set(`resume:${uuid}`, JSON.stringify(data));

        setStatusText("Analysis complete, redirecting...");
        navigate(`/resume/${uuid}`);
      } catch (aiError: any) {
        console.error("AI Analysis Error:", aiError);

        // Check for specific error types
        if (aiError?.error?.code === "error_400_from_delegate") {
          if (aiError?.error?.message?.includes("Permission denied")) {
            throw new Error(
              "Your daily limit has been reached. Please try again later"
            );
          } else if (aiError?.error?.message?.includes("usage-limited")) {
            throw new Error(
              "You've reached the usage limit for AI analysis. Please try again later."
            );
          }
        }

        // Generic AI error
        throw new Error(
          "Failed to analyze resume. The AI service is currently unavailable."
        );
      }
    } catch (error: any) {
      console.error("Analysis Error:", error);

      // Show user-friendly error message
      if (error.message) {
        handleError(error.message);
      } else {
        handleError("An unexpected error occurred. Please try again.");
      }
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file || !isFormValid) return;

    handleAnalyze({ companyName, jobTitle, jobDescription, file });
  };

  /*   const handleRetry = () => {
    setError(null);
    if (file && isFormValid) {
      handleAnalyze({ companyName, jobTitle, jobDescription, file });
    }
  }; */

  return (
    <main>
      <AnimatedGradient />
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Smart feedback for your dream job</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium">{error}</p>
                  {/*                   <button
                    onClick={handleRetry}
                    className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
                  >
                    Try again
                  </button> */}
                </div>
              </div>
            </div>
          )}

          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img src="/images/resume-scan.gif" className="w-full" />
              <button
                onClick={() => {
                  setIsProcessing(false);
                  setStatusText("");
                }}
                className="mt-4 text-gray-600 hover:text-gray-800 underline"
              >
                Cancel
              </button>
            </>
          ) : (
            <h2>Drop your resume for an ATS score and improvement tips</h2>
          )}

          {!isProcessing && (
            <form
              id="upload-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 mt-8"
            >
              <div className="form-div">
                <label htmlFor="company-name">Company Name</label>
                <input
                  type="text"
                  name="company-name"
                  placeholder="Company Name"
                  id="company-name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-title">Job Title</label>
                <input
                  type="text"
                  name="job-title"
                  placeholder="Job Title"
                  id="job-title"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-description">Job Description</label>
                <textarea
                  rows={5}
                  name="job-description"
                  placeholder="Job Description"
                  id="job-description"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-div">
                <label htmlFor="uploader">Upload Resume</label>
                <FileUploader onFileSelect={handleFileSelect} />
              </div>

              <button
                className={`primary-button ${
                  !isFormValid ? "opacity-50 cursor-not-allowed" : ""
                }`}
                type="submit"
                disabled={!isFormValid}
              >
                Analyze Resume
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default Upload;
