import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RetentionRate, RetentionCertificate } from '../accounting/entities/retention.entity';
import { Employee, PayrollRun, PayrollLedger } from '../accounting/entities/payroll.entity';
import { Company } from '../accounting/entities/company.entity';
import { ThirdParty } from '../accounting/entities/third-party.entity';
import { Account } from '../accounting/entities/account.entity';
import { AccountingModule } from '../accounting/accounting.module';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            RetentionRate,
            RetentionCertificate,
            Employee,
            PayrollRun,
            PayrollLedger,
            Company,
            ThirdParty,
            Account
        ]),
        forwardRef(() => AccountingModule)
    ],
    controllers: [PayrollController],
    providers: [PayrollService],
    exports: [
        TypeOrmModule.forFeature([
            RetentionRate,
            RetentionCertificate,
            Employee,
            PayrollRun,
            PayrollLedger
        ]),
        PayrollService
    ]
})
export class PayrollModule {}