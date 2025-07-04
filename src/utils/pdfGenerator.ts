import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Analysis } from '../types';

export const generatePDFReport = async (element: HTMLElement, analysis: Analysis) => {
  try {
    // Show loading state
    const loadingDiv = document.createElement('div');
    loadingDiv.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;">
        <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
          <div style="margin-bottom: 10px;">Generating PDF Report...</div>
          <div style="width: 200px; height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden;">
            <div style="width: 100%; height: 100%; background: #3b82f6; animation: loading 2s infinite;"></div>
          </div>
        </div>
      </div>
      <style>
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      </style>
    `;
    document.body.appendChild(loadingDiv);

    // Create a clone of the element for PDF generation
    const clonedElement = element.cloneNode(true) as HTMLElement;
    
    // Apply PDF-specific styles
    clonedElement.style.width = '210mm';
    clonedElement.style.padding = '20px';
    clonedElement.style.backgroundColor = 'white';
    clonedElement.style.fontFamily = 'Arial, sans-serif';
    
    // Create a temporary container
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '210mm';
    tempContainer.appendChild(clonedElement);
    document.body.appendChild(tempContainer);

    // Generate canvas from the cloned element
    const canvas = await html2canvas(clonedElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123 // A4 height in pixels at 96 DPI
    });

    // Clean up temporary container
    document.body.removeChild(tempContainer);

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add title page
    pdf.setFontSize(24);
    pdf.setTextColor(31, 41, 55); // gray-800
    pdf.text('LLM Navigator Analysis Report', 20, 30);
    
    pdf.setFontSize(16);
    pdf.setTextColor(75, 85, 99); // gray-600
    pdf.text(`Website: ${analysis.website}`, 20, 45);
    pdf.text(`Keywords: ${analysis.keywords.join(', ')}`, 20, 55);
    pdf.text(`Generated: ${new Date(analysis.createdAt).toLocaleDateString()}`, 20, 65);
    
    // Add overall score
    pdf.setFontSize(48);
    const scoreColor = analysis.score >= 80 ? [16, 185, 129] : analysis.score >= 60 ? [245, 158, 11] : [239, 68, 68];
    pdf.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    pdf.text(`${analysis.score}/100`, 20, 100);
    
    pdf.setFontSize(14);
    pdf.setTextColor(75, 85, 99);
    pdf.text('Overall LLM Navigator Score', 20, 110);
    
    // Add metrics breakdown
    pdf.setFontSize(16);
    pdf.setTextColor(31, 41, 55);
    pdf.text('Metrics Breakdown:', 20, 130);
    
    pdf.setFontSize(12);
    const metrics = [
      { label: 'Content Clarity', score: analysis.metrics.contentClarity },
      { label: 'Semantic Richness', score: analysis.metrics.semanticRichness },
      { label: 'Structured Data', score: analysis.metrics.structuredData },
      { label: 'Natural Language', score: analysis.metrics.naturalLanguage },
      { label: 'Keyword Relevance', score: analysis.metrics.keywordRelevance }
    ];
    
    metrics.forEach((metric, index) => {
      const y = 145 + (index * 10);
      pdf.setTextColor(75, 85, 99);
      pdf.text(`${metric.label}:`, 25, y);
      
      const metricColor = metric.score >= 80 ? [16, 185, 129] : metric.score >= 60 ? [245, 158, 11] : [239, 68, 68];
      pdf.setTextColor(metricColor[0], metricColor[1], metricColor[2]);
      pdf.text(`${metric.score}/100`, 120, y);
    });

    // Add insights
    pdf.setFontSize(16);
    pdf.setTextColor(31, 41, 55);
    pdf.text('AI-Generated Insights:', 20, 210);
    
    pdf.setFontSize(11);
    pdf.setTextColor(75, 85, 99);
    const splitInsights = pdf.splitTextToSize(analysis.insights, 170);
    pdf.text(splitInsights, 20, 225);

    // Add new page for recommendations if needed
    if (analysis.recommendations.length > 0) {
      pdf.addPage();
      
      pdf.setFontSize(16);
      pdf.setTextColor(31, 41, 55);
      pdf.text('Recommendations:', 20, 30);
      
      let yPos = 45;
      analysis.recommendations.forEach((rec, index) => {
        if (yPos > 250) {
          pdf.addPage();
          yPos = 30;
        }
        
        pdf.setFontSize(14);
        pdf.setTextColor(31, 41, 55);
        pdf.text(`${index + 1}. ${rec.title}`, 20, yPos);
        
        pdf.setFontSize(11);
        pdf.setTextColor(75, 85, 99);
        const splitDesc = pdf.splitTextToSize(rec.description, 170);
        pdf.text(splitDesc, 25, yPos + 8);
        
        pdf.setFontSize(10);
        pdf.text(`Priority: ${rec.priority} | Difficulty: ${rec.difficulty} | Impact: +${rec.expectedImpact} points`, 25, yPos + 20);
        
        yPos += 35;
      });
    }

    // Add detailed analysis pages from canvas
    pdf.addPage();
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);

    // Add additional pages if content is longer than one page
    heightLeft -= pageHeight;
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Remove loading state
    document.body.removeChild(loadingDiv);

    // Save the PDF
    const fileName = `llm-analysis-${analysis.website.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Error generating PDF:', error);
    
    // Remove loading state if it exists
    const loadingDiv = document.querySelector('[style*="position: fixed"]');
    if (loadingDiv) {
      document.body.removeChild(loadingDiv);
    }
    
    // Show error message
    alert('Error generating PDF report. Please try again.');
  }
};