import {
    EntitySubscriberInterface,
    EventSubscriber,
    InsertEvent,
    UpdateEvent,
    RemoveEvent,
    DataSource,
} from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
    constructor(dataSource: DataSource) {
        dataSource.subscribers.push(this);
    }

    // No auditamos la propia tabla de logs para evitar bucles infinitos
    private shouldAudit(tableName: string): boolean {
        return tableName !== 'audit_logs';
    }

    async afterInsert(event: InsertEvent<any>) {
        if (!this.shouldAudit(event.metadata.tableName)) return;

        const auditLog = event.manager.create(AuditLog, {
            tableName: event.metadata.tableName,
            recordId: event.entity.id?.toString() || 'N/A',
            action: 'INSERT',
            newValue: event.entity,
            // User capture would go here if context was available
        });
        await event.manager.save(auditLog);
    }

    async beforeUpdate(event: UpdateEvent<any>) {
        if (!this.shouldAudit(event.metadata.tableName)) return;

        const auditLog = event.manager.create(AuditLog, {
            tableName: event.metadata.tableName,
            recordId: event.entity?.id?.toString() || event.databaseEntity?.id?.toString() || 'N/A',
            action: 'UPDATE',
            oldValue: event.databaseEntity,
            newValue: event.entity,
        });
        await event.manager.save(auditLog);
    }

    async beforeRemove(event: RemoveEvent<any>) {
        if (!this.shouldAudit(event.metadata.tableName)) return;

        const auditLog = event.manager.create(AuditLog, {
            tableName: event.metadata.tableName,
            recordId: event.entityId?.toString() || 'N/A',
            action: 'DELETE',
            oldValue: event.databaseEntity,
        });
        await event.manager.save(auditLog);
    }
}
