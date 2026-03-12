// Backup and Rollback Manager
// Handles safe database operations with rollback capability

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface BackupResult {
  success: boolean;
  backupId: string;
  timestamp: string;
  tablesBackedUp: string[];
  error?: string;
}

export interface RollbackResult {
  success: boolean;
  rollbackId: string;
  tablesRestored: string[];
  error?: string;
}

export class BackupManager {
  // Create comprehensive backup before migration
  static async createMigrationBackup(): Promise<BackupResult> {
    const backupId = `migration_${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    try {
      console.log(`🔄 Creating backup: ${backupId}`);
      
      const tablesToBackup = [
        'modules',
        'tasks', 
        'transactions',
        'student_profiles',
        'student_module_instances',
        'academic_events'
      ];

      const backupTables: string[] = [];

      // Create backup tables
      for (const table of tablesToBackup) {
        const backupTableName = `${table}_backup_${backupId}`;
        
        const { error } = await supabase.rpc('create_backup_table', {
          table_name: table,
          backup_table_name: backupTableName
        });

        if (error) {
          console.warn(`Failed to backup ${table}: ${error.message}`);
        } else {
          backupTables.push(table);
          console.log(`✅ Backed up: ${table} -> ${backupTableName}`);
        }
      }

      // Log backup operation
      await this.logBackupOperation(backupId, 'CREATE', backupTables, timestamp);

      return {
        success: backupTables.length > 0,
        backupId,
        timestamp,
        tablesBackedUp: backupTables
      };

    } catch (error) {
      console.error('Backup failed:', error);
      return {
        success: false,
        backupId,
        timestamp,
        tablesBackedUp: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Rollback to specific backup
  static async rollbackToBackup(backupId: string): Promise<RollbackResult> {
    const rollbackId = `rollback_${Date.now()}`;
    
    try {
      console.log(`🔄 Rolling back to backup: ${backupId}`);
      
      const tablesToRollback = [
        'modules',
        'tasks',
        'transactions', 
        'student_profiles',
        'student_module_instances',
        'academic_events'
      ];

      const restoredTables: string[] = [];

      // Restore each table from backup
      for (const table of tablesToRollback) {
        const backupTableName = `${table}_backup_${backupId}`;
        
        // Check if backup table exists
        const { data: backupExists } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_name', backupTableName)
          .single();

        if (!backupExists) {
          console.warn(`Backup table not found: ${backupTableName}`);
          continue;
        }

        // Create current state backup before rollback
        const preRollbackBackup = `${table}_prerollback_${rollbackId}`;
        await supabase.rpc('create_backup_table', {
          table_name: table,
          backup_table_name: preRollbackBackup
        });

        // Restore from backup
        const { error } = await supabase.rpc('restore_from_backup', {
          table_name: table,
          backup_table_name: backupTableName
        });

        if (error) {
          console.warn(`Failed to restore ${table}: ${error.message}`);
        } else {
          restoredTables.push(table);
          console.log(`✅ Restored: ${table} <- ${backupTableName}`);
        }
      }

      // Log rollback operation
      await this.logBackupOperation(rollbackId, 'ROLLBACK', restoredTables, new Date().toISOString());

      return {
        success: restoredTables.length > 0,
        rollbackId,
        tablesRestored: restoredTables
      };

    } catch (error) {
      console.error('Rollback failed:', error);
      return {
        success: false,
        rollbackId,
        tablesRestored: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Clean up old backups
  static async cleanupOldBackups(keepDays: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);
    
    try {
      console.log(`🧹 Cleaning up backups older than ${keepDays} days`);
      
      // Get old backup tables
      const { data: oldBackups } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .like('table_name', '%_backup_%')
        .lt('create_time', cutoffDate.toISOString());

      if (oldBackups && oldBackups.length > 0) {
        for (const backup of oldBackups) {
          const { error } = await supabase.rpc('drop_table', {
            table_name: backup.table_name
          });

          if (error) {
            console.warn(`Failed to drop ${backup.table_name}: ${error.message}`);
          } else {
            console.log(`🗑️ Dropped: ${backup.table_name}`);
          }
        }
      }

    } catch (error) {
      console.error('Backup cleanup failed:', error);
    }
  }

  // Get backup history
  static async getBackupHistory(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('backup_operations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw new Error(`Failed to get backup history: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get backup history:', error);
      return [];
    }
  }

  // Validate backup integrity
  static async validateBackup(backupId: string): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    try {
      const tablesToCheck = ['modules', 'tasks', 'transactions'];
      
      for (const table of tablesToCheck) {
        const backupTableName = `${table}_backup_${backupId}`;
        
        // Check if backup table exists
        const { count: backupCount } = await supabase
          .from(backupTableName)
          .select('*', { count: 'exact', head: true });

        // Check original table count
        const { count: originalCount } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (backupCount === null) {
          issues.push(`Backup table ${backupTableName} not found`);
        } else if (backupCount === 0 && originalCount && originalCount > 0) {
          issues.push(`Backup table ${backupTableName} is empty but original has data`);
        }
      }

      return {
        valid: issues.length === 0,
        issues
      };

    } catch (error) {
      return {
        valid: false,
        issues: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  // Create migration checkpoint
  static async createCheckpoint(checkpointName: string): Promise<string> {
    const checkpointId = `checkpoint_${checkpointName}_${Date.now()}`;
    
    try {
      console.log(`📍 Creating checkpoint: ${checkpointId}`);
      
      // Backup critical tables
      const backupResult = await this.createMigrationBackup();
      
      if (!backupResult.success) {
        throw new Error(`Failed to create backup for checkpoint: ${backupResult.error}`);
      }

      // Store checkpoint metadata
      const { error } = await supabase
        .from('migration_checkpoints')
        .insert({
          checkpoint_id: checkpointId,
          checkpoint_name: checkpointName,
          backup_id: backupResult.backupId,
          tables_backed_up: backupResult.tablesBackedUp,
          created_at: new Date().toISOString()
        });

      if (error) {
        throw new Error(`Failed to store checkpoint: ${error.message}`);
      }

      console.log(`✅ Checkpoint created: ${checkpointId}`);
      return checkpointId;

    } catch (error) {
      console.error('Checkpoint creation failed:', error);
      throw error;
    }
  }

  // Rollback to checkpoint
  static async rollbackToCheckpoint(checkpointId: string): Promise<RollbackResult> {
    try {
      console.log(`🔄 Rolling back to checkpoint: ${checkpointId}`);
      
      // Get checkpoint metadata
      const { data: checkpoint, error } = await supabase
        .from('migration_checkpoints')
        .select('backup_id')
        .eq('checkpoint_id', checkpointId)
        .single();

      if (error || !checkpoint) {
        throw new Error(`Checkpoint not found: ${checkpointId}`);
      }

      // Rollback to the backup associated with checkpoint
      return await this.rollbackToBackup(checkpoint.backup_id);

    } catch (error) {
      console.error('Checkpoint rollback failed:', error);
      return {
        success: false,
        rollbackId: `checkpoint_rollback_${Date.now()}`,
        tablesRestored: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Log backup operations
  private static async logBackupOperation(
    operationId: string,
    operationType: 'CREATE' | 'ROLLBACK',
    tables: string[],
    timestamp: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('backup_operations')
        .insert({
          operation_id: operationId,
          operation_type: operationType,
          tables_backed_up: tables,
          created_at: timestamp
        });

      if (error) {
        console.error('Failed to log backup operation:', error);
      }
    } catch (error) {
      console.error('Backup logging failed:', error);
    }
  }

  // Get current migration status
  static async getMigrationStatus(): Promise<{
    phase: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    lastBackup?: string;
    lastCheckpoint?: string;
  }> {
    try {
      // Get latest backup operation
      const { data: lastOperation } = await supabase
        .from('backup_operations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Get latest checkpoint
      const { data: lastCheckpoint } = await supabase
        .from('migration_checkpoints')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        phase: 'Phase 2: Data Migration',
        status: 'in_progress', // This would be updated based on actual progress
        lastBackup: lastOperation?.operation_id,
        lastCheckpoint: lastCheckpoint?.checkpoint_id
      };

    } catch (error) {
      console.error('Failed to get migration status:', error);
      return {
        phase: 'Phase 2: Data Migration',
        status: 'failed'
      };
    }
  }
}
