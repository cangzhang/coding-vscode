export enum actions {
  UPDATE_CURRENT_MR = `mr.update`,
  CLOSE_MR = `mr.close`,
  MR_APPROVE = `mr.approve`,
  MR_DISAPPROVE = `mr.disapprove`,
  MR_MERGE = `mr.merge`,
  MR_UPDATE_TITLE = `mr.update.title`,
  MR_UPDATE_COMMENTS = `mr.update.comments`,
  MR_ADD_COMMENT = `mr.add.comment`,
  MR_GET_ACTIVITIES = `mr.get.activities`,
  MR_TOGGLE_LOADING = `mr.update.toggleLoading`,
  MR_UPDATE_REVIEWERS = `mr.update.reviewers`,
  MR_UPDATE_DESC = `mr.update.desc`,
  MR_REVIEWERS_INIT = `mr.reviewers.init`,
  MR_ACTIVITIES_INIT = `mr.activities.init`,
}
