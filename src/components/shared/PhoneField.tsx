/**
 * PhoneField — Country-code selector + phone number input with validation.
 *
 * - Defaults to GB (+44) as the initial country
 * - Validates using libphonenumber-js on every keystroke (after first blur)
 * - Calls `onChange` with the E.164 string ("+447911123456") when valid,
 *   or the raw dial-code + digits when not yet valid (so the parent can still
 *   capture partial input and decide whether to allow submission)
 * - `onValidChange(isValid)` fires whenever validity changes so the parent
 *   can block form submission on an invalid number
 */
import { useEffect, useRef, useState } from "react";
import {
  parsePhoneNumber,
  isValidPhoneNumber,
  getCountryCallingCode,
  type CountryCode,
} from "libphonenumber-js";
import { CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";

// ─── Country list ─────────────────────────────────────────────────────────────
// Pinned at the top, then sorted alphabetically.

type Country = { code: CountryCode | "__divider__"; name: string; dial: string; flag: string };

function flag(iso: string) {
  // Convert ISO-3166 2-letter code → emoji flag (regional indicator symbols)
  return [...iso.toUpperCase()]
    .map((c) => String.fromCodePoint(c.charCodeAt(0) - 65 + 0x1f1e6))
    .join("");
}

const PINNED: CountryCode[] = ["GB", "IE", "US", "CA", "AU", "NG", "GH", "ZA", "IN"];

const ALL_COUNTRIES: Country[] = (() => {
  const all: CountryCode[] = [
    "AF","AL","DZ","AD","AO","AG","AR","AM","AU","AT","AZ","BS","BH","BD","BB",
    "BY","BE","BZ","BJ","BT","BO","BA","BW","BR","BN","BG","BF","BI","CV","KH",
    "CM","CA","CF","TD","CL","CN","CO","KM","CG","CD","CR","HR","CU","CY","CZ",
    "DK","DJ","DM","DO","EC","EG","SV","GQ","ER","EE","SZ","ET","FJ","FI","FR",
    "GA","GM","GE","DE","GH","GR","GD","GT","GN","GW","GY","HT","HN","HU","IS",
    "IN","ID","IR","IQ","IE","IL","IT","JM","JP","JO","KZ","KE","KI","KW","KG",
    "LA","LV","LB","LS","LR","LY","LI","LT","LU","MG","MW","MY","MV","ML","MT",
    "MH","MR","MU","MX","FM","MD","MC","MN","ME","MA","MZ","MM","NA","NR","NP",
    "NL","NZ","NI","NE","NG","MK","NO","OM","PK","PW","PA","PG","PY","PE","PH",
    "PL","PT","QA","RO","RU","RW","KN","LC","VC","WS","SM","ST","SA","SN","RS",
    "SC","SL","SG","SK","SI","SB","SO","ZA","SS","ES","LK","SD","SR","SE","CH",
    "SY","TW","TJ","TZ","TH","TL","TG","TO","TT","TN","TR","TM","TV","UG","UA",
    "AE","GB","US","UY","UZ","VU","VE","VN","YE","ZM","ZW",
  ];

  const pinSet = new Set<string>(PINNED);

  const toEntry = (code: CountryCode): Country | null => {
    try {
      const dial = `+${getCountryCallingCode(code)}`;
      return { code, name: new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code, dial, flag: flag(code) };
    } catch { return null; }
  };

  const pinned  = PINNED.map(toEntry).filter(Boolean) as Country[];
  const rest    = all
    .filter((c) => !pinSet.has(c))
    .map(toEntry)
    .filter(Boolean)
    .sort((a, b) => a!.name.localeCompare(b!.name)) as Country[];

  return [...pinned, { code: "__divider__" as const, name: "──────────", dial: "", flag: "" }, ...rest];
})();

// ─── Component ────────────────────────────────────────────────────────────────

interface PhoneFieldProps {
  /** Current E.164 value managed by parent */
  value: string;
  /** Called with E.164 ("+447911123456") or best-effort partial string */
  onChange: (e164: string) => void;
  /** Fires whenever validity flips */
  onValidChange?: (isValid: boolean) => void;
  required?: boolean;
  label?: string;
}

export function PhoneField({
  value,
  onChange,
  onValidChange,
  required,
  label = "Phone number",
}: PhoneFieldProps) {
  const [country, setCountry] = useState<CountryCode>("GB");
  const [localNumber, setLocalNumber] = useState("");
  const [touched, setTouched] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevValid = useRef<boolean | null>(null);

  // Initialise local state from incoming E.164 value on first render
  useEffect(() => {
    if (!value) return;
    try {
      const parsed = parsePhoneNumber(value);
      if (parsed?.country) {
        setCountry(parsed.country as CountryCode);
        // Show national number without dial code
        setLocalNumber(parsed.nationalNumber as string);
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally only run once

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const computeValidity = (cty: CountryCode, num: string): { e164: string; valid: boolean } => {
    const raw = num.replace(/\D/g, "");
    if (!raw) return { e164: "", valid: false };

    try {
      const dial = getCountryCallingCode(cty);
      const candidate = `+${dial}${raw}`;
      const valid = isValidPhoneNumber(candidate, cty);
      if (valid) {
        const parsed = parsePhoneNumber(candidate, cty);
        return { e164: parsed.format("E.164"), valid: true };
      }
      return { e164: candidate, valid: false };
    } catch {
      return { e164: `+${getCountryCallingCode(cty)}${raw}`, valid: false };
    }
  };

  const handleNumberChange = (raw: string) => {
    // Strip non-numeric except leading +
    const cleaned = raw.replace(/[^\d\s\-().]/g, "");
    setLocalNumber(cleaned);

    const { e164, valid } = computeValidity(country, cleaned);
    onChange(e164 || cleaned);

    if (prevValid.current !== valid) {
      prevValid.current = valid;
      onValidChange?.(valid);
    }
  };

  const handleCountryChange = (code: CountryCode) => {
    setCountry(code);
    setDropdownOpen(false);

    const { e164, valid } = computeValidity(code, localNumber);
    onChange(e164 || localNumber);

    if (prevValid.current !== valid) {
      prevValid.current = valid;
      onValidChange?.(valid);
    }
  };

  const { valid } = computeValidity(country, localNumber);
  const showError  = touched && localNumber.length > 0 && !valid;
  const showCheck  = touched && valid;

  const selectedCountry = ALL_COUNTRIES.find((c) => c.code === country);
  const dial = selectedCountry?.dial ?? "";

  return (
    <div className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1 flex gap-1.5">

        {/* Country selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex h-[42px] items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 text-sm outline-none hover:border-primary/60 focus:border-primary transition-colors"
            aria-label="Select country code"
          >
            <span className="text-base leading-none">{selectedCountry?.flag}</span>
            <span className="text-muted-foreground text-xs font-mono">{dial}</span>
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border border-border bg-popover shadow-lg overflow-hidden">
              <div className="max-h-60 overflow-y-auto py-1">
                {ALL_COUNTRIES.map((c, idx) =>
                  // Divider
                  c.code === "__divider__" ? (
                    <div key={`div-${idx}`} className="mx-3 my-1 border-t border-border" />
                  ) : (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleCountryChange(c.code as CountryCode)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted/50 transition-colors text-left ${
                        c.code === country ? "bg-muted/80 font-medium" : ""
                      }`}
                    >
                      <span className="text-base w-6 text-center">{c.flag}</span>
                      <span className="flex-1 truncate">{c.name}</span>
                      <span className="text-xs font-mono text-muted-foreground shrink-0">{c.dial}</span>
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Number input */}
        <div className="relative flex-1">
          <input
            type="tel"
            value={localNumber}
            onChange={(e) => handleNumberChange(e.target.value)}
            onBlur={() => setTouched(true)}
            required={required}
            placeholder="7911 123456"
            inputMode="tel"
            autoComplete="tel-national"
            className={`w-full h-[42px] rounded-xl border bg-background px-3 pr-8 text-sm outline-none transition-colors ${
              showError
                ? "border-destructive focus:border-destructive"
                : showCheck
                  ? "border-emerald-500 focus:border-emerald-500"
                  : "border-border focus:border-primary"
            }`}
          />
          {/* Validity icon */}
          {showCheck && (
            <CheckCircle2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500 pointer-events-none" />
          )}
          {showError && (
            <AlertCircle className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive pointer-events-none" />
          )}
        </div>
      </div>

      {/* Validation message */}
      {showError && (
        <p className="mt-1 text-xs text-destructive">
          Enter a valid {selectedCountry?.name ?? "phone"} number.
        </p>
      )}
    </div>
  );
}
