// Organizations have been merged into Studios (2-tier structure)
// This controller is kept as an empty stub for backward compatibility
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('organizations')
@Controller('organizations')
export class OrganizationsController {}
