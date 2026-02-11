/**
 * FAQ Schema Markup Utility
 *
 * Generates JSON-LD structured data for FAQ pages following Schema.org FAQPage specification.
 * This helps AI assistants and search engines better understand FAQ content.
 */

export interface FAQItem {
  question: string;
  answer: string;
}

/**
 * Generates JSON-LD FAQ schema markup
 * @param faqs - Array of question/answer pairs
 * @returns JSON-LD string for FAQPage schema
 */
export function generateFAQSchema(faqs: FAQItem[]): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return JSON.stringify(schema);
}

/**
 * Injects FAQ schema into the document head
 * Call this in useEffect to add/update schema when component mounts
 * @param faqs - Array of question/answer pairs
 * @param scriptId - Unique ID for the script tag (for cleanup)
 */
export function injectFAQSchema(faqs: FAQItem[], scriptId: string = 'faq-schema'): void {
  // Remove existing script if present
  const existingScript = document.getElementById(scriptId);
  if (existingScript) {
    existingScript.remove();
  }

  // Create and inject new script
  const script = document.createElement('script');
  script.id = scriptId;
  script.type = 'application/ld+json';
  script.textContent = generateFAQSchema(faqs);
  document.head.appendChild(script);
}

/**
 * Removes FAQ schema from document head
 * Call this in useEffect cleanup to remove schema when component unmounts
 * @param scriptId - ID of the script tag to remove
 */
export function removeFAQSchema(scriptId: string = 'faq-schema'): void {
  const script = document.getElementById(scriptId);
  if (script) {
    script.remove();
  }
}
