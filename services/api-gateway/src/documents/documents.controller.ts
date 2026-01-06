import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, UpdateDocumentDto, DocumentResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('documents')
@Controller('documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @ApiOperation({ summary: 'Upload/register a new document' })
  @ApiResponse({ status: 201, description: 'Document created successfully', type: DocumentResponseDto })
  async createDocument(
    @Body() createDocumentDto: CreateDocumentDto,
    @Request() req,
  ): Promise<DocumentResponseDto> {
    return this.documentsService.create(createDocumentDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all documents with filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'loadId', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
  async getDocuments(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('loadId') loadId?: string,
    @Query('type') type?: string,
  ) {
    return this.documentsService.findAll({ page, limit, loadId, type });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific document by ID' })
  @ApiResponse({ status: 200, description: 'Document retrieved successfully', type: DocumentResponseDto })
  async getDocument(@Param('id') id: string): Promise<DocumentResponseDto> {
    return this.documentsService.findOne(id);
  }

  @Get('load/:loadId')
  @ApiOperation({ summary: 'Get all documents for a specific load' })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
  async getDocumentsForLoad(@Param('loadId') loadId: string): Promise<DocumentResponseDto[]> {
    return this.documentsService.findByLoad(loadId);
  }

  @Put(':id/verify')
  @ApiOperation({ summary: 'Mark a document as verified' })
  @ApiResponse({ status: 200, description: 'Document verified', type: DocumentResponseDto })
  async verifyDocument(@Param('id') id: string): Promise<DocumentResponseDto> {
    return this.documentsService.verify(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a document' })
  @ApiResponse({ status: 204, description: 'Document deleted successfully' })
  async deleteDocument(@Param('id') id: string): Promise<void> {
    return this.documentsService.remove(id);
  }
}
