import { GoogleGenerativeAI } from '@google/generative-ai';
import { BadRequestException, Injectable } from '@nestjs/common';
const PDFParser = require('pdf2json');
@Injectable()
export class AnalysisService {

    private genAI: GoogleGenerativeAI;

    constructor(){
        const apiKey = process.env.GEMINI_API_KEY;
        if(!apiKey){
            throw new Error('GEMINI_API_KEY is not set in environment variables');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async extractTextFromPdf(fileBuffer: Buffer) : Promise<string> {
        try{
            
            if (!fileBuffer || fileBuffer.length === 0) {
                throw new BadRequestException('Le fichier est vide ou corrompu');
            }
            
            if (!fileBuffer.toString('ascii', 0, 4).startsWith('%PDF')) {
                throw new BadRequestException('Le fichier n\'est pas un PDF valide');
            }
            
            console.log('Processing PDF buffer of size:', fileBuffer.length);
            
            return new Promise((resolve, reject) => {
                const pdfParser = new PDFParser();
                
                pdfParser.on('pdfParser_dataError', (errData: any) => {
                    console.error('PDF parse error:', errData.parserError);
                    reject(new BadRequestException('Impossible de lire le fichier PDF: ' + errData.parserError));
                });
                
                pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
                    try {
                        // Extract text from all pages
                        let text = '';
                        if (pdfData.Pages) {
                            pdfData.Pages.forEach((page: any) => {
                                if (page.Texts) {
                                    page.Texts.forEach((textItem: any) => {
                                        if (textItem.R && textItem.R.length > 0) {
                                            textItem.R.forEach((r: any) => {
                                                if (r.T) {
                                                    text += decodeURIComponent(r.T) + ' ';
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                        
                        text = text.trim();
                        console.log('Successfully extracted text, length:', text.length);
                        console.log('Text preview:', text.substring(0, 200));
                        
                        if (!text) {
                            reject(new BadRequestException('Le PDF ne contient aucun texte lisible'));
                        } else {
                            resolve(text);
                        }
                    } catch (err) {
                        console.error('Error processing PDF data:', err);
                        reject(new BadRequestException('Erreur lors du traitement du PDF: ' + err.message));
                    }
                });
                
                pdfParser.parseBuffer(fileBuffer);
            });
            
        }catch (err) {
            console.error('PDF extraction error:', err);
            if (err instanceof BadRequestException) {
                throw err;
            }
            throw new BadRequestException('Impossible de lire le fichier PDF: ' + err.message);
        }
    }

    async genAIAnalysis(resumeText: string, jobDescription: string) {

        const model = this.genAI.getGenerativeModel({
            model: 'gemma-3-4b-it'
        })

        const prompt = `
            Tu es un expert ATS international. Analyse le CV suivant par rapport à l'offre d'emploi.
            
            IMPORTANT: Retourne UNIQUEMENT le JSON, sans aucun autre texte.
            
            Offre : ${jobDescription}
            CV : ${resumeText}

            Format de réponse EXIGÉ:
            {
                "score": nombre_entre_0_et_100,
                "missingSkills": ["compétence1", "compétence2"],
                "suggestions": [{"original": "texte_original", "suggestion": "texte_suggestionné", "reason": "raison"}]
            }
            
            Si le CV est en Fr tu reponds en Fr, si c'est en Anglais reponds en Anglais. Et si c'est en autre langue reponds dans la langue du CV.
        `;
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                text = jsonMatch[0];
            } else {
                text = text.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
            }

            text = text.replace(/```json/g, '').replace(/```/g, '').trim();

            console.log('Cleaned JSON response:', text);
            return JSON.parse(text);
        } catch (error) {
            console.error("Erreur détaillée Gemini:", error);
            throw new Error("L'IA n'a pas pu formater l'analyse.");
        }
    }
}




