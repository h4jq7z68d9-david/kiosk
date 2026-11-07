# edit-course: start the local slide editor for one course, on the right branch.
# Set up once on a Mac (after cloning the repo to ~/kiosk):
#   echo 'source ~/kiosk/tools/study/edit-course.zsh' >> ~/.zshrc && source ~/.zshrc
# Then:  edit-course <course-slug>      (e.g. edit-course impressionism)
#
# Branch, in this order:
#   edits-<slug>    your earlier edits that are not published yet (keep adding to them)
#   install-<slug>  a course being installed that is not published yet (review before main)
#   main            the published site; your edits go to a new edits-<slug> branch
# Ctrl-C stops the editor; it then commits your edits on that branch and pushes it (never main).
# Lives in the repo, so each `git pull` brings the current version.
edit-course() {
  if [ -z "$1" ]; then echo "usage: edit-course <course-slug>"; return 1; fi
  cd ~/kiosk || return
  git fetch -q --prune origin || { echo "Could not reach GitHub."; return 1; }
  local b=main r
  for r in "edits-$1" "install-$1"; do
    if git rev-parse -q --verify "origin/$r" >/dev/null && ! git merge-base --is-ancestor "origin/$r" origin/main; then b=$r; break; fi
  done
  git checkout -q "$b" && git pull -q --ff-only origin "$b" || { echo "Could not switch to $b. Nothing was changed; tell Claude what it printed."; return 1; }
  echo "Editing $1 on branch $b"
  (sleep 1 && open "http://localhost:8770/" >/dev/null 2>&1 &)
  node tools/study/edit-server.js "$1"
}
