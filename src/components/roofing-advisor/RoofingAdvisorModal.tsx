"use client";

import { useState } from "react";
import { X, ArrowRight, ArrowLeft } from "lucide-react";

type Step = "issue" | "urgency" | "details" | "photos" | "property" | "contact" | "summary";

interface AssessmentData {
  issue: string;
  urgency: string;
  details: string;
  photos: boolean;
  address: string;
  name: string;
  phone: string;
  email: string;
  preferred_contact: string;
}

const steps: Step[] = ["issue", "urgency", "details", "photos", "property", "contact", "summary"];

const issueOptions = [
  { id: "leak", label: "Leak / Water Damage" },
  { id: "storm", label: "Storm Damage" },
  { id: "repair", label: "Roof Repair" },
  { id: "replacement", label: "Roof Replacement" },
  { id: "inspection", label: "Inspection" },
  { id: "unsure", label: "Not Sure" },
];

const urgencyOptions = [
  { id: "emergency", label: "Emergency / Happening Now" },
  { id: "few_days", label: "Within the Next Few Days" },
  { id: "planning", label: "Planning Ahead" },
  { id: "unsure", label: "Not Sure" },
];

export function RoofingAdvisorModal({ onClose }: { onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState<Step>("issue");
  const [data, setData] = useState<AssessmentData>({
    issue: "",
    urgency: "",
    details: "",
    photos: false,
    address: "",
    name: "",
    phone: "",
    email: "",
    preferred_contact: "email",
  });

  const stepIndex = steps.indexOf(currentStep);
  const progress = ((stepIndex + 1) / steps.length) * 100;

  const handleNext = () => {
    const nextIndex = stepIndex + 1;
    if (nextIndex < steps.length) {
      const nextStep = steps[nextIndex];
      if (nextStep) {
        setCurrentStep(nextStep);
      }
    }
  };

  const handleBack = () => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      const prevStep = steps[prevIndex];
      if (prevStep) {
        setCurrentStep(prevStep);
      }
    }
  };

  const handleSubmit = () => {
    console.log("Assessment submitted:", data);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center p-4">
      <div className="bg-white rounded-t-2xl lg:rounded-2xl w-full lg:w-full lg:max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-line p-6 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-ink">Roofing Advisor</h2>
            <p className="text-sm text-ink-muted mt-1">
              Step {stepIndex + 1} of {steps.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-subtle rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-line">
          <div
            className="h-full bg-brand transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6 lg:p-8">
          {/* Issue selection */}
          {currentStep === "issue" && (
            <div>
              <h3 className="text-xl font-semibold mb-6 text-ink">
                What's going on with your roof?
              </h3>
              <div className="space-y-3">
                {issueOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setData({ ...data, issue: option.id })}
                    className={`w-full p-4 text-left rounded-lg font-medium transition-all ${
                      data.issue === option.id
                        ? "bg-brand text-white"
                        : "bg-subtle text-ink hover:bg-line"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Urgency selection */}
          {currentStep === "urgency" && (
            <div>
              <h3 className="text-xl font-semibold mb-6 text-ink">
                How urgent is it?
              </h3>
              <div className="space-y-3">
                {urgencyOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setData({ ...data, urgency: option.id })}
                    className={`w-full p-4 text-left rounded-lg font-medium transition-all ${
                      data.urgency === option.id
                        ? "bg-brand text-white"
                        : "bg-subtle text-ink hover:bg-line"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Details */}
          {currentStep === "details" && (
            <div>
              <h3 className="text-xl font-semibold mb-6 text-ink">
                Tell us a little more
              </h3>
              <textarea
                value={data.details}
                onChange={(e) => setData({ ...data, details: e.target.value })}
                placeholder="Describe what's happening with your roof..."
                className="w-full p-4 border border-line rounded-lg font-body text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-brand"
                rows={6}
              />
            </div>
          )}

          {/* Photos */}
          {currentStep === "photos" && (
            <div>
              <h3 className="text-xl font-semibold mb-6 text-ink">
                Add photos (optional)
              </h3>
              <div className="border-2 border-dashed border-line rounded-lg p-8 text-center">
                <div className="mb-4">
                  <svg
                    className="w-12 h-12 mx-auto text-ink-muted"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <p className="text-ink font-medium mb-2">Add photos of your roof</p>
                <p className="text-sm text-ink-muted mb-4">
                  Photos help us provide a better assessment
                </p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  id="photos"
                  onChange={() => setData({ ...data, photos: true })}
                />
                <label
                  htmlFor="photos"
                  className="inline-block px-6 py-2 bg-brand text-white rounded-lg font-medium cursor-pointer hover:bg-brand-strong transition-colors"
                >
                  Choose Photos
                </label>
              </div>
            </div>
          )}

          {/* Property */}
          {currentStep === "property" && (
            <div>
              <h3 className="text-xl font-semibold mb-6 text-ink">
                Property information
              </h3>
              <input
                type="text"
                value={data.address}
                onChange={(e) => setData({ ...data, address: e.target.value })}
                placeholder="Your address"
                className="w-full p-4 border border-line rounded-lg font-body text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-brand mb-4"
              />
            </div>
          )}

          {/* Contact */}
          {currentStep === "contact" && (
            <div>
              <h3 className="text-xl font-semibold mb-6 text-ink">
                Contact information
              </h3>
              <input
                type="text"
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
                placeholder="Your name"
                className="w-full p-4 border border-line rounded-lg font-body text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-brand mb-4"
              />
              <input
                type="tel"
                value={data.phone}
                onChange={(e) => setData({ ...data, phone: e.target.value })}
                placeholder="Phone number"
                className="w-full p-4 border border-line rounded-lg font-body text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-brand mb-4"
              />
              <input
                type="email"
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                placeholder="Email address"
                className="w-full p-4 border border-line rounded-lg font-body text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          )}

          {/* Summary */}
          {currentStep === "summary" && (
            <div>
              <h3 className="text-xl font-semibold mb-6 text-ink">
                Review your assessment
              </h3>
              <div className="space-y-4 bg-subtle rounded-lg p-6">
                <div>
                  <p className="text-sm text-ink-muted">Issue</p>
                  <p className="font-semibold text-ink">
                    {issueOptions.find((o) => o.id === data.issue)?.label}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-ink-muted">Urgency</p>
                  <p className="font-semibold text-ink">
                    {urgencyOptions.find((o) => o.id === data.urgency)?.label}
                  </p>
                </div>
                {data.details && (
                  <div>
                    <p className="text-sm text-ink-muted">Details</p>
                    <p className="font-semibold text-ink">{data.details}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-ink-muted">Name</p>
                  <p className="font-semibold text-ink">{data.name}</p>
                </div>
                <div>
                  <p className="text-sm text-ink-muted">Phone</p>
                  <p className="font-semibold text-ink">{data.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-ink-muted">Email</p>
                  <p className="font-semibold text-ink">{data.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex gap-4">
            <button
              onClick={handleBack}
              disabled={stepIndex === 0}
              className="flex items-center gap-2 px-6 py-3 border border-line rounded-lg text-ink font-medium hover:bg-subtle disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {stepIndex === steps.length - 1 ? (
              <button
                onClick={handleSubmit}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-strong transition-colors"
              >
                Request My Assessment
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={
                  (currentStep === "issue" && !data.issue) ||
                  (currentStep === "urgency" && !data.urgency)
                }
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-strong disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
