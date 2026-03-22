export declare enum TimeMachineCategory {
    SUCCESS_STORY = "SUCCESS_STORY",
    INSPIRING_STORY = "INSPIRING_STORY",
    RECOGNITION = "RECOGNITION",
    DONOR_SUPPORT = "DONOR_SUPPORT",
    EVENT_BY_KIDS = "EVENT_BY_KIDS",
    VISITOR_VISIT = "VISITOR_VISIT",
    CHALLENGE_PROBLEM = "CHALLENGE_PROBLEM",
    GENERAL_UPDATE = "GENERAL_UPDATE"
}
export declare enum TimeMachineHome {
    ALL_HOMES = "ALL_HOMES",
    GIRLS_HOME_UPPAL = "GIRLS_HOME_UPPAL",
    BLIND_HOME_BEGUMPET = "BLIND_HOME_BEGUMPET",
    OLD_AGE_HOME_PEERZADIGUDA = "OLD_AGE_HOME_PEERZADIGUDA"
}
export declare class CreateTimeMachineEntryDto {
    title: string;
    eventDate: string;
    description?: string;
    category: TimeMachineCategory;
    home: TimeMachineHome;
    isPublic?: boolean;
}
export declare class UpdateTimeMachineEntryDto {
    title?: string;
    eventDate?: string;
    description?: string;
    category?: TimeMachineCategory;
    home?: TimeMachineHome;
    isPublic?: boolean;
}
