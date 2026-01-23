// Main UP Ingestion Pipeline
// Orchestrates the complete ingestion process

import { UPDataTransformer } from './transform';
import { UPDataValidator } from './validate';
import { UPDataIngestion } from './ingest';
import { IngestionResult } from './types';

export class UPIngestionPipeline {
  private universityId: string = 'up-university-id';
  private dryRun: boolean;

  constructor(dryRun: boolean = false) {
    this.dryRun = dryRun;
  }

  // Main execution method
  async execute(): Promise<IngestionResult> {
    try {
      console.log('🚀 Starting UP Ingestion Pipeline...');
      
      // Step 1: Scrape data (this would call the actual scraper)
      console.log('📥 Step 1: Scraping UP data...');
      const rawData = await this.scrapeData();
      
      // Step 2: Transform data
      console.log('🔄 Step 2: Transforming data...');
      const transformedData = await this.transformData(rawData);
      
      // Step 3: Validate data
      console.log('✅ Step 3: Validating data...');
      const validationResult = await this.validateData(transformedData);
      if (!validationResult.valid) {
        return { 
          success: false, 
          error: `Validation failed: ${validationResult.errors.join(', ')}` 
        };
      }
      
      if (validationResult.warnings && validationResult.warnings.length > 0) {
        console.warn('⚠️  Validation warnings:', validationResult.warnings);
      }
      
      // Step 4: Ingest data
      if (!this.dryRun) {
        console.log('💾 Step 4: Ingesting data...');
        const curriculumVersionId = await this.ingestData(transformedData);
        
        return { 
          success: true, 
          curriculumVersionId,
          warnings: validationResult.warnings,
          stats: {
            degreesProcessed: transformedData.degrees.length,
            modulesProcessed: transformedData.modules.length,
            curriculumItems: transformedData.curricula.reduce((sum, c) => sum + c.modules.length, 0)
          }
        };
      } else {
        console.log('🧪 DRY RUN: Skipping ingestion');
        return { 
          success: true, 
          dryRun: true,
          warnings: validationResult.warnings,
          stats: {
            degreesProcessed: transformedData.degrees.length,
            modulesProcessed: transformedData.modules.length,
            curriculumItems: transformedData.curricula.reduce((sum, c) => sum + c.modules.length, 0)
          }
        };
      }
      
    } catch (error) {
      console.error('❌ Pipeline failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Scrape data from UP yearbooks
  private async scrapeData(): Promise<any> {
    // This would integrate with the existing UP_Scraper
    // For now, we'll simulate by reading the existing JSON files
    
    try {
      // Read the scraped data from the UP_Scraper output
      const fs = require('fs').promises;
      const path = require('path');
      
      const scraperDataPath = '/home/stof/UP_Scraper';
      
      // Read degrees data
      const degreesData = await fs.readFile(
        path.join(scraperDataPath, 'unilife_degrees_2026.json'), 
        'utf8'
      );
      const degrees = JSON.parse(degreesData);
      
      // Read curriculum data
      const curriculumData = await fs.readFile(
        path.join(scraperDataPath, 'unilife_curriculum_2026.json'), 
        'utf8'
      );
      const curriculum = JSON.parse(curriculumData);
      
      return {
        degrees,
        curriculum
      };
    } catch (error) {
      throw new Error(`Failed to scrape data: ${error}`);
    }
  }

  // Transform raw data to standardized format
  private async transformData(rawData: any): Promise<{
    degrees: any[];
    modules: any[];
    curricula: any[];
  }> {
    // Get or create University of Pretoria
    const universityId = await this.getOrCreateUniversity();
    
    // Transform degrees
    const degrees = UPDataTransformer.transformDegrees(
      rawData.degrees, 
      universityId
    );
    
    // Extract unique modules from curriculum
    const uniqueModules = this.extractUniqueModules(rawData.curriculum);
    const modules = UPDataTransformer.transformModules(
      uniqueModules, 
      universityId
    );
    
    // Transform curricula
    const curricula = await this.transformCurricula(
      rawData.curriculum,
      degrees,
      universityId
    );
    
    return {
      degrees,
      modules,
      curricula
    };
  }

  // Validate transformed data
  private async validateData(data: {
    degrees: any[];
    modules: any[];
    curricula: any[];
  }): Promise<{ valid: boolean; errors: string[]; warnings?: string[] }> {
    // Validate individual data types
    const degreeValidation = UPDataValidator.validateDegrees(data.degrees);
    const moduleValidation = UPDataValidator.validateModules(data.modules);
    
    let allErrors = [...degreeValidation.errors, ...moduleValidation.errors];
    let allWarnings = [...degreeValidation.warnings, ...moduleValidation.warnings];
    
    // Validate curricula
    for (const curriculum of data.curricula) {
      const curriculumValidation = UPDataValidator.validateCurriculumPackage(curriculum);
      if (!curriculumValidation.valid) {
        allErrors.push(...curriculumValidation.errors);
      }
      if (curriculumValidation.warnings) {
        allWarnings.push(...curriculumValidation.warnings);
      }
    }
    
    // Cross-validate data consistency
    const consistencyValidation = UPDataValidator.validateDataConsistency(
      data.degrees,
      data.modules,
      data.curricula
    );
    
    allErrors.push(...consistencyValidation.errors);
    allWarnings.push(...consistencyValidation.warnings);
    
    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings.length > 0 ? allWarnings : undefined
    };
  }

  // Ingest data into database
  private async ingestData(data: {
    degrees: any[];
    modules: any[];
    curricula: any[];
  }): Promise<string> {
    // Insert data in correct order to respect foreign keys
    const result = await UPDataIngestion.bulkInsertWithTransaction(
      data.degrees,
      data.modules,
      data.curricula
    );
    
    // Activate the first curriculum version (or based on some logic)
    if (result.curriculumIds.length > 0) {
      await UPDataIngestion.activateCurriculumVersion(result.curriculumIds[0]);
      return result.curriculumIds[0];
    }
    
    throw new Error('No curriculum versions were created');
  }

  // Get or create University of Pretoria
  private async getOrCreateUniversity(): Promise<string> {
    const universityCode = 'UP';
    const universityName = 'University of Pretoria';
    
    // Check if university exists
    if (await UPDataIngestion.universityExists(universityCode)) {
      return await UPDataIngestion.getUniversityId(universityCode);
    }
    
    // Create university
    return await UPDataIngestion.insertUniversity(universityName, universityCode);
  }

  // Extract unique modules from curriculum data
  private extractUniqueModules(curriculum: any[]): any[] {
    const moduleMap = new Map();
    
    for (const item of curriculum) {
      if (!moduleMap.has(item.module_code)) {
        moduleMap.set(item.module_code, {
          code: item.module_code,
          name: item.module_name || item.module_code, // Fallback to code if name not available
          credits: 12, // Default credits - would come from module scraper
          nqf_level: undefined,
          prerequisites: undefined,
          description: undefined,
          contact_time: undefined,
          language: 'English',
          presentation_period: undefined,
          module_type: item.module_type
        });
      }
    }
    
    return Array.from(moduleMap.values());
  }

  // Transform curricula with degree mapping
  private async transformCurricula(
    curriculumData: any[],
    degrees: any[],
    universityId: string
  ): Promise<any[]> {
    // Group curriculum by degree
    const curriculumByDegree = new Map();
    
    for (const item of curriculumData) {
      const degreeCode = item.degree_code;
      if (!curriculumByDegree.has(degreeCode)) {
        curriculumByDegree.set(degreeCode, []);
      }
      curriculumByDegree.get(degreeCode).push(item);
    }
    
    const transformedCurricula = [];
    
    for (const [degreeCode, items] of curriculumByDegree) {
      // Find the corresponding degree
      const degree = degrees.find(d => d.code === degreeCode);
      if (!degree) {
        console.warn(`Degree not found for code: ${degreeCode}`);
        continue;
      }
      
      // Get degree ID from database
      const degreeId = await UPDataIngestion.getDegreeId(universityId, degreeCode);
      
      // Transform curriculum
      const curriculum = UPDataTransformer.transformCurricula(
        items as any[],
        degreeId,
        2026 // Academic year
      );
      
      transformedCurricula.push(curriculum);
    }
    
    return transformedCurricula;
  }
}
