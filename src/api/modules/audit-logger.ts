import { Change } from "../../lib/supabase";

export default class AuditLogger {
    static getChanges(values: { old: any, new: any }, module: string, by: string): Change {
        let changes = { old: {}, new: {} };
        
        for (const key in values.old) {
            const changed = JSON.stringify(values.old[key]) !== JSON.stringify(values.new[key]);
            if (changed) {
                (changes.old as any)[key] = values.old[key];
                (changes.new as any)[key] = values.new[key];
            } 
        }
        return {
            by,
            changes,
            module,
            at: new Date().toISOString()
        };
    }
}