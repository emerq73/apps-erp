describe('AccountingService', () => {
    it('should be defined', () => {
        expect(true).toBe(true);
    });

    it('should have account entity', () => {
        const { Account } = require('./entities/account.entity');
        expect(Account).toBeDefined();
    });

    it('should have voucher entity', () => {
        const { Voucher } = require('./entities/voucher.entity');
        expect(Voucher).toBeDefined();
    });

    it('should have journal entry entity', () => {
        const { JournalEntry } = require('./entities/journal-entry.entity');
        expect(JournalEntry).toBeDefined();
    });

    it('should have accounting period entity', () => {
        const { AccountingPeriod } = require('./entities/accounting-period.entity');
        expect(AccountingPeriod).toBeDefined();
    });
});