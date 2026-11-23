import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  ListTransactionsQueryDto,
  SummaryQueryDto,
} from './dto/list-transactions-query.dto';
import {
  TransactionDetailDto,
  TransactionListItemDto,
  TransactionSummaryDto,
} from './dto/transaction-response.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  /** Records with validation result and review state. */
  @Get()
  @ApiOkResponse({ type: [TransactionListItemDto] })
  list(@Query() query: ListTransactionsQueryDto) {
    return this.transactions.list(query);
  }

  /** Counts per validation status, plus every client for the filter. */
  // Declared before ':id' so "summary" isn't read as an id.
  @Get('summary')
  @ApiOkResponse({ type: TransactionSummaryDto })
  summary(@Query() query: SummaryQueryDto) {
    return this.transactions.summary(query);
  }

  /** Raw input, parsed amounts, issues, review state and history. */
  @Get(':id')
  @ApiOkResponse({ type: TransactionDetailDto })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  detail(@Param('id') id: string) {
    return this.transactions.detail(id);
  }
}
