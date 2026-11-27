"""Exact original Z-Anatomy object names. Each record is a selectable organ."""


def sides(*names):
    return [name + suffix for name in names for suffix in (".l", ".r")]


# The separate HRA female preparations stay in their own source frame.
systems = {
    "Nervous": [
        ("brain", "Brain", ["@frontal_lobes", "@parietal_lobes", "@occipital_lobes", "@temporal_lobes",
          "@insulae", "@limbic_lobes", "@cerebellum"] + sides("Pons", "Medulla oblongata", "Midbrain", "Thalamus")),
        ("spinal-cord", "Spinal cord", ["White matter of spinal cord"]),
    ],
    "Special senses": [
        ("eyes", "Eyes", sides("Cornea", "Sclera", "Lens", "Iris", "Retina")),
        ("ears", "Ears", sides("Helix", "Concha of auricle", "Lobule of auricle", "Tympanic membrane", "Malleus", "Incus", "Stapes", "Cochlea")),
        ("lacrimal-glands", "Lacrimal glands and tear drainage", sides("Lacrimal gland", "Lacrimal canaliculus", "Lacrimal sac", "Nasolacrimal duct")),
    ],
    "Endocrine": [
        ("hypothalamus", "Hypothalamus", ["Hypothalamus"]),
        ("pituitary", "Pituitary gland", ["Adenohypophysis", "Neurohypophysis"]),
        ("pineal", "Pineal gland", ["Pineal gland"]),
        ("thyroid", "Thyroid gland", ["Thyroid gland"]),
        ("parathyroids", "Parathyroid glands", sides("Superior parathyroid gland", "Inferior parathyroid gland")),
        ("adrenal-glands", "Adrenal glands", sides("Suprarenal gland")),
    ],
    "Cardiovascular": [
        ("heart", "Heart", ["Right atrium", "Left atrium", "Right ventricle", "Left ventricle"]),
        ("aorta", "Aorta", ["Ascending aorta", "Aortic arch", "Thoracic aorta", "Abdominal aorta"]),
        ("venae-cavae", "Superior and inferior venae cavae", ["Superior vena cava", "Inferior vena cava (thoracic part)", "Inferior vena cava (abdominal part)"]),
    ],
    "Lymphatic and immune": [
        ("tonsils", "Palatine tonsils", sides("Palatine tonsil")),
        ("thymus", "Thymus", ["Left lobe of thymus", "Right lobe of thymus"]),
        ("spleen", "Spleen", ["Spleen"]),
    ],
    "Respiratory": [
        ("nose", "Nose and nasal cavity", ["Nasal septal cartilage"] + sides("Major alar cartilage", "Inferior nasal concha bone")),
        ("larynx", "Larynx", ["Epiglottis", "Thyroid cartilage", "Cricoid cartilage"] + sides("Arytenoid cartilage")),
        ("trachea", "Trachea", ["Trachea"]),
        ("bronchi", "Main bronchi", ["Left main bronchus", "Right main bronchus"]),
        ("lungs", "Lungs", ["Superior lobe of right lung", "Middle lobe of right lung", "Inferior lobe of right lung", "Superior lobe of left lung", "Inferior lobe of left lung"]),
        ("diaphragm", "Diaphragm", ["Diaphragm"]),
    ],
    "Digestive": [
        ("teeth", "Teeth", ["@upper_teeth","@lower_teeth"]),
        ("tongue", "Tongue", ["Tongue"]),
        ("parotid-glands", "Parotid glands", sides("Parotid gland", "Parotid duct")),
        ("submandibular-glands", "Submandibular glands", sides("Submandibular gland", "Submandibular duct")),
        ("sublingual-glands", "Sublingual glands", sides("Sublingual gland")),
        ("pharynx", "Pharynx", ["Nasopharynx", "Oropharynx", "Laryngopharynx"]),
        ("esophagus", "Esophagus", ["Oesophagus"]),
        ("stomach", "Stomach", ["Stomach"]),
        ("liver", "Liver", ["Liver", "Hepatic portal vein"]),
        ("gallbladder", "Gallbladder and bile duct", ["Gallbladder", "Bile duct"]),
        ("pancreas", "Pancreas", ["Pancreas", "Pancreatic duct"]),
        ("small-intestine", "Small intestine", ["Duodenum", "%jejunum", "%ileum"]),
        ("large-intestine", "Large intestine", ["%cecum", "Ascending colon", "Transverse colon", "Descending colon", "Sigmoid colon"]),
        ("appendix", "Vermiform appendix", ["Vermiform appendix"]),
        ("rectum", "Rectum", ["%rectum"] + sides("External anal sphincter")),
    ],
    "Urinary": [
        ("kidneys", "Kidneys", ["%left kidney", "%right kidney", "Left renal artery", "Right renal artery"] + sides("Renal pelvis")),
        ("ureters", "Ureters", sides("Ureter")),
        ("bladder", "Urinary bladder", ["Urinary bladder"]),
        ("urethra", "Urethra", ["Urethra"]),
    ],
    "Reproductive": [
        ("testes", "Testes", sides("Testis")),
        ("epididymides", "Epididymides", sides("Epididymis")),
        ("ductus-deferentes", "Ductus deferentes", sides("Ductus deferens")),
        ("ejaculatory-ducts", "Ejaculatory ducts", sides("Ejaculatory duct")),
        ("seminal-glands", "Seminal glands", sides("Seminal gland")),
        ("prostate", "Prostate", ["Prostate"]),
        ("penis", "Penis", ["Corpus cavernosum of penis", "Corpus spongiosum of penis", "Glans penis"]),
    ],
    "Integumentary": [("skin", "Skin surface", ["@skin"])],
}
