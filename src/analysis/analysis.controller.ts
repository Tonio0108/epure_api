import { Controller, Post, Get, UseInterceptors, UploadedFile, Body, Param, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AnalysisService } from './analysis.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('analysis')
export class AnalysisController {
  constructor(
    private readonly analysisService: AnalysisService,
    private readonly prisma: PrismaService
  ) {}

  @Post('process')
  @UseInterceptors(FileInterceptor('file', {
    limits: {
        fileSize: 5 * 1024 * 1024,
        fieldSize: 10 * 1024 * 1024, 
    }
    })) 
  async processResume(
  @UploadedFile() file: Express.Multer.File,
  @Body('jobDescription') jobDescription: string
    ) {
    if (!file) {
        throw new BadRequestException("Fichier non reçu. Vérifiez la clé 'file' dans Postman");
    }
    const resumeText = await this.analysisService.extractTextFromPdf(file.buffer);
    const aiResult = await this.analysisService.genAIAnalysis(resumeText, jobDescription);

    return this.prisma.analysis.create({
      data: {
        jobTitle: jobDescription.substring(0, 100),
        score: aiResult.score,
        missingSkills: JSON.stringify(aiResult.missingSkills),
        suggestions: JSON.stringify(aiResult.suggestions),
        rawText: resumeText,
      },
    });
  }

  @Get('history')
  async getHistory() {
    return this.prisma.analysis.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.prisma.analysis.findUnique({ where: { id } });
  }
}