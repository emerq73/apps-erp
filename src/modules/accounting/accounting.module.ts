import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { Transaction } from './entities/transaction.entity';
import { ThirdParty } from './entities/third-party.entity';
import { CostCenter } from './entities/cost-center.entity';
import { AccountingService } from './accounting.service';
import { AccountingController } from './accounting.controller';

import { Voucher } from './entities/voucher.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { Company } from './entities/company.entity';
import { Tax } from './entities/tax.entity';
import { AccountingPeriod } from './entities/accounting-period.entity';
import { Budget } from './entities/budget.entity';
import { CashBox } from './entities/cash-box.entity';
import { BankAccount } from './entities/bank-account.entity';
import { AccountsPayable } from './entities/accounts-payable.entity';
import { AccountsReceivable } from './entities/accounts-receivable.entity';
import { Currency } from './entities/currency.entity';
import { ExchangeRate } from './entities/exchange-rate.entity';

import {
  RecurringEntry,
  RecurringEntryLog,
} from './entities/recurring-entry.entity';
import {
  ApprovalWorkflow,
  ApprovalRequest,
  ApprovalHistory,
} from './entities/approval-workflow.entity';
import { AuditTrail, AuditSession } from './entities/audit-trail.entity';
import {
  Project,
  ProjectTransaction,
  ProjectBudgetLine,
} from './entities/project.entity';
import {
  FixedAsset as FixedAssetV2,
  AssetDepreciationLog,
} from './entities/fixed-asset-v2.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      Transaction,
      ThirdParty,
      CostCenter,
      Voucher,
      JournalEntry,
      Company,
      Tax,
      AccountingPeriod,
      Budget,
      CashBox,
      BankAccount,
      AccountsPayable,
      AccountsReceivable,
      Currency,
      ExchangeRate,
      RecurringEntry,
      RecurringEntryLog,
      ApprovalWorkflow,
      ApprovalRequest,
      ApprovalHistory,
      AuditTrail,
      AuditSession,
      Project,
      ProjectTransaction,
      ProjectBudgetLine,
      FixedAssetV2,
      AssetDepreciationLog,
    ]),
  ],
  controllers: [AccountingController],
  providers: [AccountingService],
  exports: [AccountingService],
})
export class AccountingModule {}
