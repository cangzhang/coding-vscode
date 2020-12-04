export const ACTIVITY_TYPE = {
  create: {
    // icon: <PlusIcon />,
    text: '创建了合并请求',
  },
  update_content: {
    // icon: <EditIcon />,
    text: '更新了描述',
  },
  update_title: {
    // icon: <EditIcon />,
    text: '更新了标题',
  },
  add_reviewer: {
    // icon: <UserPlusIcon />,
    text: '增加了评审者',
  },
  del_reviewer: {
    // icon: <UserPlusIcon />,
    text: '移除了评审者',
  },
  add_watcher: {
    // icon: <EyeIcon />,
    text: '添加关注者',
  },
  del_watcher: {
    // icon: <EyeIcon />,
    text: '移除关注者',
  },
  add_label: {
    // icon: <TagIcon />,
    text: '添加标签',
  },
  del_label: {
    // icon: <TagIcon />,
    text: '移除标签',
  },
  review: {
    // icon: <ThumbsUpIcon />,
    text: '对此合并请求评审 +1',
  },
  review_undo: {
    // icon: <ThumbsDownIcon />,
    text: '撤销了对此合并请求评审 +1',
  },
  merge: {
    // icon: <CodingMergeRequestIcon />,
    text: '合并了这个合并请求',
  },
  refuse: {
    // icon: <CloseIcon />,
    text: '关闭了这个合并请求',
  },
  push: {
    // icon: <CodingGitCommitIcon />,
    text: '推送了新的提交，更新了合并请求',
  },
  push_and_revoke_grants: {
    text: '推送了新的提交，更新了合并请求，原合并授权已经自动取消',
    // icon: <CodingGitCommitIcon />,
  },
  grant: {
    text: '给此合并请求授权了合并权限',
    // icon: <UnlockIcon />,
  },
  grant_undo: {
    text: '撤销了给此合并请求的合并权限',
    // icon: <LockIcon />,
  },
  say_good: {
    text: '允许了此合并请求',
    // icon: <ThumbsUpIcon />,
  },
  say_good_and_grant: {
    text: '允许了此合并请求，并授权了合并权限',
    // icon: <UnlockIcon />,
  },
  say_bad: {
    text: '取消了对此合并请求的允许',
    // icon: <ThumbsDownIcon />,
  },
  say_bad_and_grant_revoke: {
    text: '取消了对此合并请求的权限授权',
    // icon: <LockIcon />,
  },
  add_resource_ref: {
    text: '添加了资源关联',
    // icon: <PlusIcon />,
  },
  del_resource_ref: {
    text: '取消了资源关联',
    // icon: <MinusIcon />,
  },
  add_iteration_ref: {
    text: '关联了迭代',
    // icon: <IterationIcon />,
  },
  add_milestone_ref: {
    text: '关联了里程碑',
    // icon: <MilestoneIcon />,
  },
  add_task_ref: {
    text: '关联了任务（旧版）',
    // icon: <TaskIcon />,
  },
  add_file_ref: {
    text: '关联了文件',
    // icon: <FileIcon />,
  },
  add_wiki_ref: {
    text: '关联了 Wiki',
    // icon: <FileWordOIcon />,
  },
  add_release_ref: {
    text: '关联了版本发布',
    // icon: <TagIcon />,
  },
  add_mr_ref: {
    text: '关联了合并请求',
    // icon: <CodingMergeRequestIcon />,
  },
  add_extlink_ref: {
    text: '关联了外部链接',
    // icon: <ChainIcon />,
  },
  del_iteration_ref: {
    text: '取消关联的迭代',
    // icon: <IterationIcon />,
  },
  del_milestone_ref: {
    text: '取消关联的里程碑',
    // icon: <MilestoneIcon />,
  },
  del_task_ref: {
    text: '取消关联的任务（旧版）',
    // icon: <TaskIcon />,
  },
  del_file_ref: {
    text: '取消关联的文件',
    // icon: <FileIcon />,
  },
  del_wiki_ref: {
    text: '取消关联的 Wiki',
    // icon: <FileWordOIcon />,
  },
  del_release_ref: {
    text: '取消关联的版本发布',
    // icon: <TagIcon />,
  },
  del_mr_ref: {
    text: '取消关联的合并请求',
    // icon: <CodingMergeRequestIcon />,
  },
  del_extlink_ref: {
    text: '取消关联的外部链接',
    // icon: <ChainIcon />,
  },
  add_external_iteration_ref: {
    text: '关联了',
    // icon: <IterationIcon />,
  },
  add_external_milestone_ref: {
    text: '关联了',
    // icon: <MilestoneIcon />,
  },
  add_external_task_ref: {
    text: '关联了',
    // icon: <TaskIcon />,
  },
  add_external_file_ref: {
    text: '关联了',
    // icon: <FileIcon />,
  },
  add_external_wiki_ref: {
    text: '关联了',
    // icon: <FileWordOIcon />,
  },
  add_external_release_ref: {
    text: '关联了',
    // icon: <TagIcon />,
  },
  add_external_mr_ref: {
    text: '关联了',
    // icon: <CodingMergeRequestIcon />,
  },
  add_external_extlink_ref: {
    text: '关联了',
    // icon: <ChainIcon />,
  },
  del_external_iteration_ref: {
    text: '取消关联了',
    // icon: <IterationIcon />,
  },
  del_external_milestone_ref: {
    text: '取消关联',
    // icon: <MilestoneIcon />,
  },
  del_external_task_ref: {
    text: '取消关联',
    // icon: <TaskIcon />,
  },
  del_external_file_ref: {
    text: '取消关联',
    // icon: <FileIcon />,
  },
  del_external_wiki_ref: {
    text: '取消关联',
    // icon: <FileWordOIcon />,
  },
  del_external_release_ref: {
    text: '取消关联',
    // icon: <TagIcon />,
  },
  del_external_mr_ref: {
    text: '取消关联',
    // icon: <CodingMergeRequestIcon />,
  },
  del_external_extlink_ref: {
    text: '取消关联',
    // icon: <ChainIcon />,
  },
  del_source_branch: {
    text: '删除了源分支',
    // icon: <CodeForkIcon />,
  },
  del_target_branch: {
    text: '删除了目标分支',
    // icon: <CodeForkIcon />,
  },
  restore_source_branch: {
    text: '恢复了源分支',
    // icon: <CodeForkIcon />,
  },
  restore_target_branch: {
    text: '恢复了目标分支',
    // icon: <CodeForkIcon />,
  },
  add_defect_ref: {
    text: '关联了缺陷',
    // icon: <BugIcon />,
  },
  del_defect_ref: {
    text: '取消关联的缺陷',
    // icon: <BugIcon />,
  },
  add_external_defect_ref: {
    text: '关联了项目',
    // icon: <BugIcon />,
  },
  del_external_defect_ref: {
    text: '取消关联了项目',
    // icon: <BugIcon />,
  },
  add_requirement_ref: {
    text: '关联了需求',
    // icon: <RequirementIcon />,
  },
  del_requirement_ref: {
    text: '取消关联的需求',
    // icon: <RequirementIcon />,
  },
  add_external_requirement_ref: {
    text: '关联了项目',
    // icon: <RequirementIcon />,
  },
  del_external_requirement_ref: {
    text: '取消关联了项目',
    // icon: <RequirementIcon />,
  },
  add_mission_ref: {
    text: '关联了任务',
    // icon: <MissionIcon />,
  },
  del_mission_ref: {
    text: '取消关联的任务',
    // icon: <MissionIcon />,
  },
  add_external_mission_ref: {
    text: '关联了项目',
    // icon: <MissionIcon />,
  },
  del_external_mission_ref: {
    text: '取消关联了项目',
    // icon: <MissionIcon />,
  },
};
