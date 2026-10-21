import { useEffect, useState } from "react";
import { Card, Field, Check } from "@/Components/Office";

// Scoped view of a nested form object for useForm
export function sectionForm(form, path) {
    const keys = path.split(".");
    return {
        data: keys.reduce((value, key) => value?.[key], form.data) ?? {},
        errors: Object.fromEntries(
            Object.entries(form.errors)
                .filter(([key]) => key.startsWith(`${path}.`))
                .map(([key, value]) => [key.slice(path.length + 1), value]),
        ),
        setData(name, value) {
            form.setData((data) => {
                const next = { ...data };
                let node = next;
                for (const key of keys) {
                    node[key] = { ...node[key] };
                    node = node[key];
                }
                node[name] = value;
                return next;
            });
        },
    };
}

export function AddressFields({ form }) {
    const address = sectionForm(form, "address");
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [barangays, setBarangays] = useState([]);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingBarangays, setLoadingBarangays] = useState(false);

    const selectedProvince =
        address.data.province || address.data.state_province || "";
    const selectedCity =
        address.data.city_municipality || address.data.city || "";
    const selectedBarangay = address.data.barangay || "";

    // Load provinces on mount
    useEffect(() => {
        let isMounted = true;
        setLoadingProvinces(true);
        fetch("/api/psgc/provinces")
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => {
                if (isMounted) {
                    setProvinces(Array.isArray(data) ? data : []);
                }
            })
            .catch(() => {})
            .finally(() => {
                if (isMounted) setLoadingProvinces(false);
            });
        return () => {
            isMounted = false;
        };
    }, []);

    // Load cities when province changes
    useEffect(() => {
        if (!selectedProvince) {
            setCities([]);
            setBarangays([]);
            return;
        }
        let isMounted = true;
        setLoadingCities(true);
        fetch(
            `/api/psgc/cities-municipalities?province=${encodeURIComponent(selectedProvince)}`,
        )
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => {
                if (isMounted) {
                    setCities(Array.isArray(data) ? data : []);
                }
            })
            .catch(() => {})
            .finally(() => {
                if (isMounted) setLoadingCities(false);
            });
        return () => {
            isMounted = false;
        };
    }, [selectedProvince]);

    // Load barangays when city changes
    useEffect(() => {
        if (!selectedCity) {
            setBarangays([]);
            return;
        }
        let isMounted = true;
        setLoadingBarangays(true);
        fetch(`/api/psgc/barangays?city=${encodeURIComponent(selectedCity)}`)
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => {
                if (isMounted) {
                    setBarangays(Array.isArray(data) ? data : []);
                }
            })
            .catch(() => {})
            .finally(() => {
                if (isMounted) setLoadingBarangays(false);
            });
        return () => {
            isMounted = false;
        };
    }, [selectedCity]);

    const handleProvinceChange = (e) => {
        const provName = e.target.value;
        address.setData("province", provName);
        address.setData("state_province", provName);
        address.setData("city_municipality", "");
        address.setData("city", "");
        address.setData("barangay", "");
    };

    const handleCityChange = (e) => {
        const cityName = e.target.value;
        address.setData("city_municipality", cityName);
        address.setData("city", cityName);
        address.setData("barangay", "");

        // Auto-fill zip code if known from city
        const cityObj = cities.find((c) => c.name === cityName);
        if (cityObj?.zip_code) {
            address.setData("zip_code", cityObj.zip_code);
            address.setData("postal_zip", cityObj.zip_code);
        }
    };

    const handleBarangayChange = (e) => {
        const brgyName = e.target.value;
        address.setData("barangay", brgyName);
    };

    return (
        <Card
            title="02 / Residential address"
            description="Philippine Standard Geographic Code (PSGC) selection for administrative coordination."
        >
            <div className="grid gap-5 md:grid-cols-2">
                <div>
                    <label
                        htmlFor="address_province"
                        className="mb-2 block text-sm font-medium"
                    >
                        Province <span className="text-red-600">*</span>
                    </label>
                    <select
                        id="address_province"
                        name="address[province]"
                        value={selectedProvince}
                        onChange={handleProvinceChange}
                        disabled={loadingProvinces}
                        className="control"
                        required
                    >
                        <option value="">
                            {loadingProvinces
                                ? "Loading provinces..."
                                : "Select Province"}
                        </option>
                        {selectedProvince &&
                            !provinces.some(
                                (p) => p.name === selectedProvince,
                            ) && (
                                <option value={selectedProvince}>
                                    {selectedProvince}
                                </option>
                            )}
                        {provinces.map((p) => (
                            <option key={p.code || p.name} value={p.name}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                    {address.errors.province && (
                        <p className="mt-1 text-xs text-red-700">
                            {address.errors.province}
                        </p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="address_city"
                        className="mb-2 block text-sm font-medium"
                    >
                        City / Municipality{" "}
                        <span className="text-red-600">*</span>
                    </label>
                    <select
                        id="address_city"
                        name="address[city_municipality]"
                        value={selectedCity}
                        onChange={handleCityChange}
                        disabled={!selectedProvince || loadingCities}
                        className="control"
                        required
                    >
                        <option value="">
                            {!selectedProvince
                                ? "Select a province first"
                                : loadingCities
                                  ? "Loading cities / municipalities..."
                                  : "Select City / Municipality"}
                        </option>
                        {selectedCity &&
                            !cities.some((c) => c.name === selectedCity) && (
                                <option value={selectedCity}>
                                    {selectedCity}
                                </option>
                            )}
                        {cities.map((c) => (
                            <option key={c.code || c.name} value={c.name}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                    {address.errors.city_municipality && (
                        <p className="mt-1 text-xs text-red-700">
                            {address.errors.city_municipality}
                        </p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="address_barangay"
                        className="mb-2 block text-sm font-medium"
                    >
                        Barangay
                    </label>
                    <select
                        id="address_barangay"
                        name="address[barangay]"
                        value={selectedBarangay}
                        onChange={handleBarangayChange}
                        disabled={!selectedCity || loadingBarangays}
                        className="control"
                    >
                        <option value="">
                            {!selectedCity
                                ? "Select a city/municipality first"
                                : loadingBarangays
                                  ? "Loading barangays..."
                                  : "Select Barangay"}
                        </option>
                        {selectedBarangay &&
                            !barangays.some(
                                (b) => b.name === selectedBarangay,
                            ) && (
                                <option value={selectedBarangay}>
                                    {selectedBarangay}
                                </option>
                            )}
                        {barangays.map((b) => (
                            <option key={b.code || b.name} value={b.name}>
                                {b.name}
                            </option>
                        ))}
                    </select>
                    {address.errors.barangay && (
                        <p className="mt-1 text-xs text-red-700">
                            {address.errors.barangay}
                        </p>
                    )}
                </div>

                <Field
                    form={address}
                    name="zip_code"
                    label="ZIP Code"
                    maxLength={20}
                    placeholder="e.g., 8700"
                />

                <div className="md:col-span-2">
                    <Field
                        form={address}
                        name="street_subdivision"
                        label="Street Name / House No. / Building / Subdivision"
                        maxLength={250}
                        placeholder="e.g., Fortich St., Purok 4, Pine Breeze Subd."
                    />
                </div>
            </div>
        </Card>
    );
}

export function EmergencyFields({ form }) {
    return (
        <Card
            title="03 / Emergency contact"
            description="Person to contact in case of urgent health or safety situations."
        >
            <div className="grid gap-5 md:grid-cols-3">
                <Field
                    form={form}
                    name="emergency_name"
                    label="Emergency contact name"
                    required
                    maxLength={150}
                />
                <Field
                    form={form}
                    name="emergency_relationship"
                    label="Relationship to you"
                    maxLength={100}
                    placeholder="e.g., Parent, Guardian, Sibling"
                />
                <Field
                    form={form}
                    name="emergency_phone"
                    label="Emergency contact mobile"
                    type="tel"
                    required
                    hint="09xxxxxxxxx or +639xxxxxxxxx"
                />
            </div>
        </Card>
    );
}

const CONDITIONS_LIST = [
    "Anemia",
    "Anxiety",
    "Asthma",
    "Blood Clots",
    "Cerebrovascular Accident",
    "Depression",
    "Hypertension",
    "Thyroid Disease",
    "Allergies",
    "Arthritis",
    "Cancer",
    "Diabetes",
    "Migraine Headaches",
    "Peptic Ulcer Disease",
    "Seizure Disorder",
    "Other",
];

const SUBSTANCE_QUESTIONS = [
    {
        key: "tobacco_vape",
        question: "Do you use tobacco, cigarettes, or vape?",
    },
    {
        key: "alcohol",
        question: "Do you use alcohol?",
    },
    {
        key: "caffeine",
        question: "Do you consume caffeine?",
    },
    {
        key: "drugs",
        question: "Do you use recreational/non-prescription drugs?",
    },
];

const SUBSTANCE_OPTIONS = ["No", "Daily", "Weekly", "Less", "Former User"];

export function MedicalHistoryFields({ form }) {
    const medical = sectionForm(form, "medical_history");
    const substance = sectionForm(form, "medical_history.substance_use");

    const currentConditions = Array.isArray(medical.data.conditions)
        ? medical.data.conditions
        : [];

    return (
        <Card
            title="04 / Medical history"
            description="Share your health background in strict confidence. Medical records are restricted to guidance personnel."
        >
            <div className="space-y-6">
                <fieldset>
                    <legend className="mb-3 text-sm font-medium text-slate-800">
                        Conditions that apply to you
                    </legend>
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                        {CONDITIONS_LIST.map((condition) => (
                            <label
                                key={condition}
                                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-xs transition cursor-pointer ${
                                    currentConditions.includes(condition)
                                        ? "border-sky-500 bg-sky-50 font-semibold text-sky-950"
                                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-sky-300 text-sky-600 focus:ring-sky-400"
                                    checked={currentConditions.includes(
                                        condition,
                                    )}
                                    onChange={(e) =>
                                        medical.setData(
                                            "conditions",
                                            e.target.checked
                                                ? [
                                                      ...currentConditions,
                                                      condition,
                                                  ]
                                                : currentConditions.filter(
                                                      (item) =>
                                                          item !== condition,
                                                  ),
                                        )
                                    }
                                />
                                {condition}
                            </label>
                        ))}
                    </div>
                </fieldset>

                {currentConditions.includes("Other") && (
                    <Field
                        form={medical}
                        name="other_conditions_specify"
                        label="Other medical conditions"
                        type="textarea"
                        required
                        maxLength={2000}
                        placeholder="Please specify any other medical conditions..."
                    />
                )}

                <div className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/40 p-4">
                    <Check
                        form={medical}
                        name="on_prescription_meds"
                        label="I am currently taking prescription medication."
                    />
                    {medical.data.on_prescription_meds && (
                        <Field
                            form={medical}
                            name="current_meds_specify"
                            label="Current prescription medications"
                            type="textarea"
                            required
                            maxLength={2000}
                            placeholder="Specify medication names and dosages..."
                        />
                    )}
                </div>

                <div className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/40 p-4">
                    <Check
                        form={medical}
                        name="recent_surgeries_past_5_yrs"
                        label="I have had surgery within the past 5 years."
                    />
                    {medical.data.recent_surgeries_past_5_yrs && (
                        <Field
                            form={medical}
                            name="surgeries_specify"
                            label="Surgeries within the past 5 years"
                            type="textarea"
                            required
                            maxLength={2000}
                            placeholder="Specify procedure type and year..."
                        />
                    )}
                </div>

                <div className="border-t border-slate-200/80 pt-5">
                    <Field
                        form={medical}
                        name="family_medical_history_notes"
                        label="Family medical history notes"
                        type="textarea"
                        maxLength={3000}
                        hint="Describe any notable hereditary conditions or health history in your family."
                        placeholder="e.g., Family history of asthma, cardiovascular disease, diabetes..."
                    />
                </div>

                <div className="border-t border-slate-200/80 pt-5">
                    <h3 className="mb-2 text-sm font-bold text-slate-900">
                        Substance usage questionnaire
                    </h3>
                    <p className="mb-4 text-xs text-slate-500">
                        Please indicate your current or previous frequency for
                        each item.
                    </p>
                    <div className="space-y-4">
                        {SUBSTANCE_QUESTIONS.map((item) => {
                            const currentValue =
                                substance.data[item.key] || "No";
                            return (
                                <div
                                    key={item.key}
                                    className="rounded-xl border border-slate-200/80 bg-white p-4"
                                >
                                    <p className="text-xs font-medium text-slate-800">
                                        {item.question}
                                    </p>
                                    <div className="mt-2.5 flex flex-wrap gap-2">
                                        {SUBSTANCE_OPTIONS.map((opt) => {
                                            const isSelected =
                                                currentValue === opt;
                                            return (
                                                <button
                                                    type="button"
                                                    key={opt}
                                                    onClick={() =>
                                                        substance.setData(
                                                            item.key,
                                                            opt,
                                                        )
                                                    }
                                                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                                        isSelected
                                                            ? "bg-sky-600 text-white shadow-xs"
                                                            : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                                                    }`}
                                                >
                                                    {opt}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {substance.errors[item.key] && (
                                        <p className="mt-1 text-xs text-red-700">
                                            {substance.errors[item.key]}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </Card>
    );
}
