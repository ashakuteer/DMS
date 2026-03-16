import { IsString, IsOptional, IsBoolean, IsArray, IsDateString, IsEnum } from 'class-validator';

export enum TimeMachineCategory {
  SUCCESS_STORY = 'SUCCESS_STORY',
  INSPIRING_STORY = 'INSPIRING_STORY',
  RECOGNITION = 'RECOGNITION',
  DONOR_SUPPORT = 'DONOR_SUPPORT',
  EVENT_BY_KIDS = 'EVENT_BY_KIDS',
  VISITOR_VISIT = 'VISITOR_VISIT',
  CHALLENGE_PROBLEM = 'CHALLENGE_PROBLEM',
  GENERAL_UPDATE = 'GENERAL_UPDATE',
}

export enum TimeMachineHome {
  ALL_HOMES = 'ALL_HOMES',
  GIRLS_HOME_UPPAL = 'GIRLS_HOME_UPPAL',
  BLIND_HOME_BEGUMPET = 'BLIND_HOME_BEGUMPET',
  OLD_AGE_HOME_PEERZADIGUDA = 'OLD_AGE_HOME_PEERZADIGUDA',
}

export class CreateTimeMachineEntryDto {
  @IsString()
  title: string;

  @IsDateString()
  eventDate: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(TimeMachineCategory)
  category: TimeMachineCategory;

  @IsEnum(TimeMachineHome)
  home: TimeMachineHome;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdateTimeMachineEntryDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TimeMachineCategory)
  category?: TimeMachineCategory;

  @IsOptional()
  @IsEnum(TimeMachineHome)
  home?: TimeMachineHome;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
