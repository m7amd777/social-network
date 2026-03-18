import { useEffect, useState, useMemo } from "react";
import { Check, X } from "lucide-react";
import "../styles/components/PasswordStrengthMeter.css";

interface PasswordStrengthMeterProps {
  password: string;
}

interface Requirement {
  label: string;
  test: (pass: string) => boolean;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const [requirementsMet, setRequirementsMet] = useState<boolean[]>([]);

  const requirements: Requirement[] = useMemo(
    () => [
      {
        label: "At least 6 characters",
        test: (pass: string) => pass.length >= 6,
      },
      {
        label: "Contains at least one letter",
        test: (pass: string) => /[a-zA-Z]/.test(pass),
      },
      {
        label: "Contains at least one number",
        test: (pass: string) => /[0-9]/.test(pass),
      },
    ],
    []
  );

  useEffect(() => {
    const met = requirements.map((req) => req.test(password));
    setRequirementsMet(met);
  }, [password, requirements]);

  const metCount = requirementsMet.filter(Boolean).length;
  const strength = metCount;

  const getBarColor = (index: number): string => {
    if (index >= strength) return "";
    if (strength === 1) return "weak";
    if (strength === 2) return "medium";
    if (strength === 3) return "strong";
    return "";
  };

  return (
    <div className="password-strength-meter">
      <div className="strength-bar-container">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`strength-bar ${getBarColor(i)} ${
              i >= strength ? "inactive" : "active"
            }`}
          />
        ))}
      </div>

      <div className="requirements-list">
        {requirements.map((req, i) => (
          <div
            key={req.label}
            className={`requirement-item ${requirementsMet[i] ? "met" : ""}`}
          >
            {requirementsMet[i] ? (
              <Check size={14} className="requirement-icon" />
            ) : (
              <X size={14} className="requirement-icon" />
            )}
            {req.label}
          </div>
        ))}
      </div>
    </div>
  );
}
