import './tailwind_theme/tailwind.css';
// ==========================================================
      // CONFIGURATION
      // ==========================================================

      const MAX_FILE_SIZE = 50 * 1024 * 1024;

      const chapterList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      // ==========================================================
      // APPLICATION STATE
      // ==========================================================

      const chapters = {};

      chapterList.forEach((chapterId) => {
        chapters[chapterId] = {
          id: chapterId,
          title: `Chapter ${chapterId}`,

          video: null,

          uploading: false,
          progress: 0,

          uploadType: null, // "new" | "replace"

          uploadTimer: null,

          pendingFile: null,

          previousVideo: null,

          error: null,
        };
      });

      // Chapter waiting for delete confirmation
      let pendingDeleteChapterId = null;

      // ==========================================================
      // DOM REFERENCES
      // ==========================================================

      const chaptersContainer = document.getElementById("chaptersContainer");

      const emptyState = document.getElementById("emptyState");

      const progressText = document.getElementById("progressText");

      const progressPercentage = document.getElementById("progressPercentage");

      const overallProgress = document.getElementById("overallProgress");

      const deleteModal = document.getElementById("deleteModal");

      const cancelDeleteButton = document.getElementById("cancelDeleteButton");

      const confirmDeleteButton = document.getElementById(
        "confirmDeleteButton",
      );

      // ==========================================================
      // INITIALIZE
      // ==========================================================

      document.addEventListener("DOMContentLoaded", () => {
        renderAllChapters();

        updateOverallProgress();

        initializeMobileMenu();

        lucide.createIcons();

        // Firebase data can later be loaded here.
        loadChapterVideos();
      });

      // ==========================================================
      // RENDER ALL CHAPTERS
      // ==========================================================

      function renderAllChapters() {
        chaptersContainer.innerHTML = "";

        chapterList.forEach((chapterId) => {
          renderChapter(chapterId);
        });

        lucide.createIcons();
      }

      // ==========================================================
      // RENDER SINGLE CHAPTER
      // ==========================================================

      function renderChapter(chapterId) {
        const chapter = chapters[chapterId];

        const existing = document.getElementById(`chapter-${chapterId}`);

        const chapterElement = createChapterElement(chapter);

        if (existing) {
          existing.replaceWith(chapterElement);
        } else {
          chaptersContainer.appendChild(chapterElement);
        }

        lucide.createIcons();

        attachChapterEvents(chapterId);
      }

      // ==========================================================
      // CREATE CHAPTER ELEMENT
      // ==========================================================

      function createChapterElement(chapter) {
        const article = document.createElement("article");

        article.id = `chapter-${chapter.id}`;

        article.className =
          "overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-card transition";

        const isOpen = article.dataset.open === "true";

        // Preserve open state when re-rendering
        const oldArticle = document.getElementById(`chapter-${chapter.id}`);

        const wasOpen = oldArticle?.dataset.open === "true";

        article.dataset.open = wasOpen ? "true" : "false";

        // ------------------------------------------------------
        // Status
        // ------------------------------------------------------

        let statusText = "No Video";
        let statusClass = "bg-stone-100 text-stone-500";
        let statusDot = "bg-stone-400";

        if (chapter.uploading) {
          statusText = "Uploading...";
          statusClass = "bg-orange-50 text-brand";
          statusDot = "bg-brand";
        } else if (chapter.error) {
          statusText = "Upload Error";
          statusClass = "bg-red-50 text-error";
          statusDot = "bg-error";
        } else if (chapter.video) {
          statusText = "Video Uploaded";
          statusClass = "bg-green-50 text-success";
          statusDot = "bg-success";
        }

        // ------------------------------------------------------
        // Header
        // ------------------------------------------------------

        const headerButton = document.createElement("button");

        headerButton.type = "button";

        headerButton.className = `group flex w-full items-center gap-3 p-4 text-left transition hover:bg-stone-50 sm:p-5 ${
          wasOpen ? "bg-orange-50/30" : ""
        }`;

        headerButton.setAttribute("aria-expanded", wasOpen ? "true" : "false");

        headerButton.setAttribute(
          "aria-controls",
          `chapter-content-${chapter.id}`,
        );

        headerButton.id = `chapter-button-${chapter.id}`;

        const number = document.createElement("span");

        number.className = `flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition ${
          wasOpen
            ? "bg-brand text-white"
            : "bg-orange-50 text-brand group-hover:bg-brand group-hover:text-white"
        }`;

        number.textContent = String(chapter.id).padStart(2, "0");

        const titleWrapper = document.createElement("div");

        titleWrapper.className = "min-w-0 flex-1";

        const title = document.createElement("div");

        title.className = "font-semibold text-ink";

        title.textContent = chapter.title;

        const status = document.createElement("div");

        status.className = `mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${statusClass}`;

        status.innerHTML = `
                <span class="h-1.5 w-1.5 rounded-full ${statusDot}"></span>
                ${statusText}
            `;

        const chevronWrapper = document.createElement("span");

        chevronWrapper.className =
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-stone-400 transition group-hover:bg-stone-100 group-hover:text-ink";

        chevronWrapper.innerHTML = `
                <i
                    data-lucide="chevron-down"
                    class="chevron h-5 w-5 ${wasOpen ? "rotate" : ""}"
                ></i>
            `;

        titleWrapper.appendChild(title);
        titleWrapper.appendChild(status);

        headerButton.appendChild(number);
        headerButton.appendChild(titleWrapper);
        headerButton.appendChild(chevronWrapper);

        // ------------------------------------------------------
        // Body
        // ------------------------------------------------------

        const content = document.createElement("div");

        content.id = `chapter-content-${chapter.id}`;

        content.className = `accordion-content ${wasOpen ? "open" : ""}`;

        content.setAttribute("role", "region");

        content.setAttribute("aria-labelledby", `chapter-button-${chapter.id}`);

        const inner = document.createElement("div");

        inner.className = "accordion-inner";

        const body = document.createElement("div");

        body.className = "border-t border-stone-100 p-4 sm:p-6";

        body.innerHTML = renderChapterBody(chapter);

        inner.appendChild(body);
        content.appendChild(inner);

        article.appendChild(headerButton);
        article.appendChild(content);

        return article;
      }

      // ==========================================================
      // RENDER CHAPTER BODY
      // ==========================================================

      function renderChapterBody(chapter) {
        if (chapter.uploading) {
          return renderUploadingState(chapter);
        }

        if (chapter.video) {
          return renderUploadedState(chapter);
        }

        return renderUploadDropzone(chapter);
      }

      // ==========================================================
      // INITIAL UPLOAD DROPZONE
      // ==========================================================

      function renderUploadDropzone(chapter) {
        return `

                <div
                    class="dropzone group rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 p-6 text-center sm:p-10"
                    id="dropzone-${chapter.id}"
                    data-chapter="${chapter.id}"
                    tabindex="0"
                    role="button"
                    aria-label="Upload video for ${chapter.title}"
                >

                    <input
                        type="file"
                        id="file-input-${chapter.id}"
                        class="hidden"
                        accept="video/*"
                        aria-label="Choose video for ${chapter.title}"
                    />

                    <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-brand transition group-hover:scale-105">
                        <i data-lucide="upload-cloud" class="h-7 w-7"></i>
                    </div>

                    <h3 class="mt-5 text-base font-semibold text-ink">
                        Upload ${chapter.title} Video
                    </h3>

                    <p class="mt-2 text-sm text-stone-500">
                        Drag and drop your video here
                    </p>

                    <p class="my-2 text-xs font-medium text-stone-400">
                        or
                    </p>

                    <button
                        type="button"
                        class="choose-video-button btn-lift inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c94025] focus:outline-none focus:ring-4 focus:ring-orange-100"
                        data-chapter="${chapter.id}"
                    >
                        <i data-lucide="video" class="h-4 w-4"></i>
                        Choose Video
                    </button>

                    <p class="mt-4 text-xs text-stone-400">
                        Maximum file size: <strong>50 MB</strong>
                    </p>

                </div>

            `;
      }

      // ==========================================================
      // UPLOADING STATE
      // ==========================================================

      function renderUploadingState(chapter) {
        const file = chapter.pendingFile;

        const filename = file?.name || "Video file";

        const size = file ? formatFileSize(file.size) : "";

        const isReplacement = chapter.uploadType === "replace";

        return `

                <div class="rounded-2xl border border-orange-100 bg-orange-50/40 p-5 sm:p-6">

                    <div class="flex items-start gap-4">

                        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand shadow-sm">
                            <div class="spinner">
                                <i data-lucide="loader-circle" class="h-5 w-5"></i>
                            </div>
                        </div>

                        <div class="min-w-0 flex-1">

                            <div class="flex flex-wrap items-center justify-between gap-2">

                                <div>
                                    <p class="font-semibold text-ink">
                                        ${isReplacement ? "Replacing Video" : "Uploading"}
                                    </p>

                                    <p class="mt-1 truncate text-sm text-stone-500">
                                        ${escapeHtml(filename)}
                                    </p>
                                </div>

                                <span class="text-sm font-bold text-brand">
                                    ${chapter.progress}%
                                </span>

                            </div>

                            <div class="mt-4 h-2 overflow-hidden rounded-full bg-white">

                                <div
                                    class="progress-bar h-full rounded-full bg-brand"
                                    style="width: ${chapter.progress}%"
                                ></div>

                            </div>

                            <div class="mt-2 flex items-center justify-between text-xs text-stone-400">

                                <span>
                                    ${size}
                                </span>

                                <span>
                                    ${
                                      chapter.progress < 100
                                        ? "Uploading..."
                                        : "Processing..."
                                    }
                                </span>

                            </div>

                        </div>

                    </div>

                    <button
                        type="button"
                        class="cancel-upload-button mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 focus:outline-none focus:ring-4 focus:ring-stone-100"
                        data-chapter="${chapter.id}"
                    >
                        <i data-lucide="x" class="h-4 w-4"></i>
                        Cancel Upload
                    </button>

                </div>

            `;
      }

      // ==========================================================
      // UPLOADED VIDEO STATE
      // ==========================================================

      function renderUploadedState(chapter) {
        const video = chapter.video;

        return `

                <div class="space-y-5">

                    <!-- Video Preview -->

                    <div class="overflow-hidden rounded-2xl bg-stone-950 shadow-sm">

                        <video
                            controls
                            preload="metadata"
                            class="aspect-video w-full object-contain"
                            src="${escapeAttribute(video.url)}"
                            aria-label="${escapeAttribute(video.fileName)} preview"
                        >
                            Your browser does not support video playback.
                        </video>

                    </div>


                    <!-- Video Information -->

                    <div class="rounded-2xl border border-stone-200 bg-stone-50/50 p-4 sm:p-5">

                        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                            <div class="min-w-0">

                                <div class="flex items-center gap-2">

                                    <i
                                        data-lucide="video"
                                        class="h-4 w-4 shrink-0 text-brand"
                                    ></i>

                                    <p class="truncate font-semibold text-ink">
                                        ${escapeHtml(video.fileName)}
                                    </p>

                                </div>

                                <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">

                                    <span>
                                        ${formatFileSize(video.fileSize)}
                                    </span>

                                    <span class="text-stone-300">
                                        •
                                    </span>

                                    <span class="inline-flex items-center gap-1.5 font-medium text-success">
                                        <span class="h-1.5 w-1.5 rounded-full bg-success"></span>
                                        Video Uploaded
                                    </span>

                                </div>

                                <p class="mt-2 text-xs text-stone-400">
                                    Uploaded: ${formatDate(video.uploadedAt)}
                                </p>

                            </div>

                            <span class="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-success">
                                <i data-lucide="check-circle-2" class="h-3.5 w-3.5"></i>
                                Ready
                            </span>

                        </div>


                        <!-- Controls -->

                        <div class="mt-5 flex flex-col gap-2 sm:flex-row">

                            <button
                                type="button"
                                class="replace-video-button btn-lift inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#c94025] focus:outline-none focus:ring-4 focus:ring-orange-100"
                                data-chapter="${chapter.id}"
                            >
                                <i data-lucide="refresh-cw" class="h-4 w-4"></i>
                                Replace Video
                            </button>

                            <button
                                type="button"
                                class="delete-video-button inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-error transition hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100"
                                data-chapter="${chapter.id}"
                            >
                                <i data-lucide="trash-2" class="h-4 w-4"></i>
                                Delete
                            </button>

                        </div>

                    </div>

                </div>

            `;
      }

      // ==========================================================
      // ATTACH CHAPTER EVENTS
      // ==========================================================

      function attachChapterEvents(chapterId) {
        const chapter = chapters[chapterId];

        const article = document.getElementById(`chapter-${chapterId}`);

        if (!article) return;

        // ------------------------------------------------------
        // Accordion
        // ------------------------------------------------------

        const header = article.querySelector(`#chapter-button-${chapterId}`);

        header?.addEventListener("click", () => {
          toggleChapter(chapterId);
        });

        // ------------------------------------------------------
        // Choose Video
        // ------------------------------------------------------

        const chooseButton = article.querySelector(".choose-video-button");

        const fileInput = article.querySelector(`#file-input-${chapterId}`);

        chooseButton?.addEventListener("click", (event) => {
          event.stopPropagation();

          fileInput?.click();
        });

        fileInput?.addEventListener("change", (event) => {
          const file = event.target.files?.[0];

          if (file) {
            handleVideoSelect(chapterId, file);
          }

          event.target.value = "";
        });

        // ------------------------------------------------------
        // Dropzone
        // ------------------------------------------------------

        const dropzone = article.querySelector(`#dropzone-${chapterId}`);

        if (dropzone) {
          dropzone.addEventListener("click", (event) => {
            if (event.target.closest(".choose-video-button")) {
              return;
            }

            fileInput?.click();
          });

          dropzone.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();

              fileInput?.click();
            }
          });

          dropzone.addEventListener("dragover", (event) => {
            event.preventDefault();

            dropzone.classList.add("drag-over");
          });

          dropzone.addEventListener("dragleave", () => {
            dropzone.classList.remove("drag-over");
          });

          dropzone.addEventListener("drop", (event) => {
            event.preventDefault();

            dropzone.classList.remove("drag-over");

            const file = event.dataTransfer.files?.[0];

            if (file) {
              handleVideoSelect(chapterId, file);
            }
          });
        }

        // ------------------------------------------------------
        // Cancel Upload
        // ------------------------------------------------------

        const cancelButton = article.querySelector(".cancel-upload-button");

        cancelButton?.addEventListener("click", () => {
          cancelUpload(chapterId);
        });

        // ------------------------------------------------------
        // Replace Video
        // ------------------------------------------------------

        const replaceButton = article.querySelector(".replace-video-button");

        replaceButton?.addEventListener("click", () => {
          openReplacementPicker(chapterId);
        });

        // ------------------------------------------------------
        // Delete
        // ------------------------------------------------------

        const deleteButton = article.querySelector(".delete-video-button");

        deleteButton?.addEventListener("click", () => {
          showDeleteConfirmation(chapterId);
        });
      }

      // ==========================================================
      // ACCORDION
      // ==========================================================

      function toggleChapter(chapterId) {
        const article = document.getElementById(`chapter-${chapterId}`);

        if (!article) return;

        const button = article.querySelector(`#chapter-button-${chapterId}`);

        const content = article.querySelector(`#chapter-content-${chapterId}`);

        const chevron = article.querySelector(".chevron");

        const isOpen = article.dataset.open === "true";

        if (isOpen) {
          article.dataset.open = "false";

          button.setAttribute("aria-expanded", "false");

          content.classList.remove("open");

          chevron.classList.remove("rotate");

          article
            .querySelector("span.flex.h-10")
            ?.classList.remove("bg-brand", "text-white");

          article
            .querySelector("span.flex.h-10")
            ?.classList.add("bg-orange-50", "text-brand");
        } else {
          article.dataset.open = "true";

          button.setAttribute("aria-expanded", "true");

          content.classList.add("open");

          chevron.classList.add("rotate");

          article
            .querySelector("span.flex.h-10")
            ?.classList.remove("bg-orange-50", "text-brand");

          article
            .querySelector("span.flex.h-10")
            ?.classList.add("bg-brand", "text-white");
        }
      }

      function openChapter(chapterId) {
        const article = document.getElementById(`chapter-${chapterId}`);

        if (!article) return;

        if (article.dataset.open !== "true") {
          toggleChapter(chapterId);
        }
      }

      function closeChapter(chapterId) {
        const article = document.getElementById(`chapter-${chapterId}`);

        if (!article) return;

        if (article.dataset.open === "true") {
          toggleChapter(chapterId);
        }
      }

      // ==========================================================
      // VIDEO SELECTION
      // ==========================================================

      function handleVideoSelect(chapterId, file) {
        const validation = validateVideo(file);

        if (!validation.valid) {
          showToast(validation.message, "error");

          return;
        }

        const chapter = chapters[chapterId];

        if (chapter.uploading) {
          return;
        }

        // New upload
        chapter.uploadType = chapter.video ? "replace" : "new";

        chapter.pendingFile = file;

        chapter.previousVideo = chapter.video ? { ...chapter.video } : null;

        chapter.uploading = true;
        chapter.progress = 0;
        chapter.error = null;

        renderChapter(chapterId);

        openChapter(chapterId);

        uploadVideo(chapterId, file);
      }

      // ==========================================================
      // VALIDATE VIDEO
      // ==========================================================

      function validateVideo(file) {
        if (!file) {
          return {
            valid: false,
            message: "Please select a valid video file.",
          };
        }

        // MIME type validation
        if (!file.type || !file.type.startsWith("video/")) {
          return {
            valid: false,
            message: "Please select a valid video file.",
          };
        }

        // Maximum size
        if (file.size > MAX_FILE_SIZE) {
          return {
            valid: false,
            message:
              "This video is larger than the 50 MB limit. Please choose a smaller video.",
          };
        }

        return {
          valid: true,
          message: "",
        };
      }

      // ==========================================================
      // UPLOAD VIDEO
      // ==========================================================

      function uploadVideo(chapterId, file) {
        const chapter = chapters[chapterId];

        // ------------------------------------------------------
        // FIREBASE STORAGE INTEGRATION
        // ------------------------------------------------------
        //
        // TODO:
        //
        // Upload video to Firebase Storage.
        //
        // Suggested path:
        //
        // ar/{arUID}/chapters/{chapterId}/video
        //
        // For real Firebase uploads, use uploadBytesResumable()
        // so the progress and cancellation can use:
        //
        // uploadTask.on(
        //     "state_changed",
        //     ...
        // );
        //
        // ------------------------------------------------------

        /*
            Example Firebase implementation:

            const storageRef = ref(
                storage,
                `ar/${arUID}/chapters/${chapterId}/video`
            );

            const uploadTask =
                uploadBytesResumable(
                    storageRef,
                    file
                );

            uploadTask.on(
                "state_changed",

                (snapshot) => {

                    const progress =
                        Math.round(
                            (
                                snapshot.bytesTransferred /
                                snapshot.totalBytes
                            ) * 100
                        );

                    chapter.progress =
                        progress;

                    renderChapter(chapterId);

                },

                (error) => {

                    chapter.uploading = false;
                    chapter.error = error.message;

                    renderChapter(chapterId);

                    showToast(
                        "Upload failed. Please try again.",
                        "error"
                    );

                },

                async () => {

                    const downloadURL =
                        await getDownloadURL(
                            uploadTask.snapshot.ref
                        );

                    // Save new video only after success
                    finalizeUpload(
                        chapterId,
                        downloadURL
                    );

                }
            );

            */

        // ------------------------------------------------------
        // FRONTEND PROTOTYPE UPLOAD SIMULATION
        // ------------------------------------------------------

        let progress = 0;

        clearInterval(chapter.uploadTimer);

        chapter.uploadTimer = setInterval(() => {
          if (!chapter.uploading) {
            clearInterval(chapter.uploadTimer);

            return;
          }

          // Randomized but smooth demo progress
          progress += Math.floor(Math.random() * 9) + 4;

          if (progress >= 100) {
            progress = 100;

            chapter.progress = 100;

            renderChapter(chapterId);

            clearInterval(chapter.uploadTimer);

            setTimeout(() => {
              finalizeUpload(chapterId);
            }, 350);

            return;
          }

          chapter.progress = progress;

          renderChapter(chapterId);
        }, 220);
      }

      // ==========================================================
      // FINALIZE UPLOAD
      // ==========================================================

      function finalizeUpload(chapterId, firebaseDownloadUrl = null) {
        const chapter = chapters[chapterId];

        const file = chapter.pendingFile;

        if (!file) {
          resetUploadState(chapterId);

          return;
        }

        const newVideo = {
          fileName: file.name,

          fileSize: file.size,

          uploadedAt: new Date(),

          /*
           * Frontend prototype:
           * createObjectURL allows the selected local
           * video to be previewed immediately.
           *
           * Firebase:
           * replace this with firebaseDownloadUrl.
           */

          url: firebaseDownloadUrl || URL.createObjectURL(file),
        };

        const wasReplacement = chapter.uploadType === "replace";

        // IMPORTANT:
        // Existing video remains untouched until
        // the replacement upload succeeds.

        const oldVideo = chapter.previousVideo;

        chapter.video = newVideo;

        chapter.uploading = false;

        chapter.progress = 100;

        chapter.pendingFile = null;

        chapter.previousVideo = null;

        chapter.uploadType = null;

        chapter.error = null;

        // ------------------------------------------------------
        // FIREBASE STORAGE INTEGRATION
        // ------------------------------------------------------
        //
        // If this was a replacement:
        //
        // 1. Upload new video first.
        // 2. Get new download URL.
        // 3. Update Firestore metadata.
        // 4. Delete old Firebase Storage file.
        //
        // Never delete the old file before the new
        // upload has succeeded.
        //
        // ------------------------------------------------------

        // ------------------------------------------------------
        // FIRESTORE INTEGRATION
        // ------------------------------------------------------
        //
        // TODO:
        //
        // Save metadata:
        //
        // chapters/{chapterId}
        //
        // {
        //     title: "Chapter 1",
        //     videoUrl: newVideo.url,
        //     fileName: newVideo.fileName,
        //     fileSize: newVideo.fileSize,
        //     uploadedAt: serverTimestamp(),
        //     status: "uploaded"
        // }
        //
        // ------------------------------------------------------

        renderChapter(chapterId);

        updateOverallProgress();

        if (wasReplacement) {
          showToast("Video replaced successfully.", "success");
        } else {
          showToast("Video uploaded successfully.", "success");
        }

        // oldVideo intentionally remains untouched
        // until backend deletion is confirmed.

        void oldVideo;
      }

      // ==========================================================
      // CANCEL UPLOAD
      // ==========================================================

      function cancelUpload(chapterId) {
        const chapter = chapters[chapterId];

        if (!chapter.uploading) {
          return;
        }

        clearInterval(chapter.uploadTimer);

        // ------------------------------------------------------
        // FIREBASE STORAGE INTEGRATION
        // ------------------------------------------------------
        //
        // For uploadBytesResumable():
        //
        // uploadTask.cancel();
        //
        // ------------------------------------------------------

        chapter.uploading = false;

        chapter.progress = 0;

        chapter.pendingFile = null;

        chapter.error = null;

        // Existing video remains unchanged
        // during replacement cancellation.

        chapter.uploadType = null;

        chapter.previousVideo = null;

        renderChapter(chapterId);

        updateOverallProgress();

        showToast("Upload cancelled.", "info");
      }

      // ==========================================================
      // REPLACE VIDEO
      // ==========================================================

      function openReplacementPicker(chapterId) {
        const input = document.createElement("input");

        input.type = "file";

        input.accept = "video/*";

        input.style.display = "none";

        input.addEventListener("change", () => {
          const file = input.files?.[0];

          if (file) {
            replaceVideo(chapterId, file);
          }

          input.remove();
        });

        document.body.appendChild(input);

        input.click();
      }

      function replaceVideo(chapterId, file) {
        const validation = validateVideo(file);

        if (!validation.valid) {
          showToast(validation.message, "error");

          return;
        }

        const chapter = chapters[chapterId];

        if (!chapter.video) {
          handleVideoSelect(chapterId, file);

          return;
        }

        // IMPORTANT:
        // Keep old video until replacement upload succeeds.

        chapter.previousVideo = { ...chapter.video };

        chapter.pendingFile = file;

        chapter.uploadType = "replace";

        chapter.uploading = true;

        chapter.progress = 0;

        chapter.error = null;

        renderChapter(chapterId);

        openChapter(chapterId);

        uploadVideo(chapterId, file);
      }

      // ==========================================================
      // DELETE VIDEO
      // ==========================================================

      function deleteVideo(chapterId) {
        const chapter = chapters[chapterId];

        if (!chapter.video) {
          return;
        }

        // ------------------------------------------------------
        // FIREBASE STORAGE INTEGRATION
        // ------------------------------------------------------
        //
        // TODO:
        //
        // Delete:
        //
        // ar/{arUID}/chapters/{chapterId}/video
        //
        // Only after user confirmation.
        //
        // ------------------------------------------------------

        // ------------------------------------------------------
        // FIRESTORE INTEGRATION
        // ------------------------------------------------------
        //
        // TODO:
        //
        // Update:
        //
        // status: "no_video"
        // videoUrl: null
        // fileName: null
        // fileSize: null
        // uploadedAt: null
        //
        // ------------------------------------------------------

        // Release local object URL
        if (chapter.video.url && chapter.video.url.startsWith("blob:")) {
          URL.revokeObjectURL(chapter.video.url);
        }

        chapter.video = null;

        chapter.progress = 0;

        chapter.error = null;

        renderChapter(chapterId);

        updateOverallProgress();

        showToast("Video deleted successfully.", "success");
      }

      // ==========================================================
      // DELETE CONFIRMATION
      // ==========================================================

      function showDeleteConfirmation(chapterId) {
        pendingDeleteChapterId = chapterId;

        deleteModal.classList.add("show");

        document.body.classList.add("overflow-hidden");

        setTimeout(() => {
          cancelDeleteButton.focus();
        }, 50);
      }

      function closeDeleteConfirmation() {
        pendingDeleteChapterId = null;

        deleteModal.classList.remove("show");

        document.body.classList.remove("overflow-hidden");
      }

      cancelDeleteButton.addEventListener("click", closeDeleteConfirmation);

      confirmDeleteButton.addEventListener("click", () => {
        if (pendingDeleteChapterId !== null) {
          const chapterId = pendingDeleteChapterId;

          closeDeleteConfirmation();

          deleteVideo(chapterId);
        }
      });

      // Click backdrop to close
      deleteModal.addEventListener("click", (event) => {
        if (event.target === deleteModal) {
          closeDeleteConfirmation();
        }
      });

      // Escape key
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && deleteModal.classList.contains("show")) {
          closeDeleteConfirmation();
        }
      });

      // ==========================================================
      // UPDATE OVERALL PROGRESS
      // ==========================================================

      function updateOverallProgress() {
        const uploadedCount = chapterList.filter((chapterId) =>
          Boolean(chapters[chapterId].video),
        ).length;

        const percentage = Math.round(
          (uploadedCount / chapterList.length) * 100,
        );

        progressText.textContent = `${uploadedCount} of 10 chapters have videos`;

        progressPercentage.textContent = `${percentage}%`;

        overallProgress.style.width = `${percentage}%`;

        overallProgress.parentElement.setAttribute("aria-valuenow", percentage);

        // Empty state
        if (uploadedCount === 0) {
          emptyState.classList.remove("hidden");
        } else {
          emptyState.classList.add("hidden");
        }

        // All chapters completed
        if (uploadedCount === 10) {
          progressText.textContent = "10 of 10 chapters have videos";
        }
      }

      // ==========================================================
      // LOAD EXISTING CHAPTER VIDEOS
      // ==========================================================

      async function loadChapterVideos() {
        // ======================================================
        // FIRESTORE INTEGRATION
        // ======================================================
        //
        // TODO:
        //
        // Fetch the user's existing chapter data.
        //
        // Example:
        //
        // const snapshot = await getDocs(
        //     collection(
        //         db,
        //         `arProjects/${arUID}/chapters`
        //     )
        // );
        //
        // snapshot.forEach((doc) => {
        //
        //     const data = doc.data();
        //
        //     chapters[data.chapterId].video = {
        //         fileName: data.fileName,
        //         fileSize: data.fileSize,
        //         uploadedAt: data.uploadedAt,
        //         url: data.videoUrl
        //     };
        //
        // });
        //
        // renderAllChapters();
        // updateOverallProgress();
        //
        // ======================================================

        // No backend configured in prototype.
        return;
      }

      // ==========================================================
      // FIREBASE STORAGE ARCHITECTURE
      // ==========================================================
      //
      // Suggested Storage structure:
      //
      // ar/
      //   {arUID}/
      //       chapters/
      //           1/
      //               video
      //           2/
      //               video
      //           ...
      //           10/
      //               video
      //
      // ==========================================================

      // ==========================================================
      // FIRESTORE DATA STRUCTURE
      // ==========================================================
      //
      // Suggested:
      //
      // arProjects/
      //     {arUID}/
      //         chapters/
      //             {chapterId}
      //
      // {
      //     title: "Chapter 1",
      //     videoUrl: "...",
      //     fileName: "chapter1.mp4",
      //     fileSize: 38400000,
      //     uploadedAt: Timestamp,
      //     status: "uploaded"
      // }
      //
      // ==========================================================

      // ==========================================================
      // LOGOUT
      // ==========================================================

      function logout() {
        // TODO:
        // Firebase Authentication:
        //
        // await signOut(auth);

        window.location.href = "login.html";
      }

      // ==========================================================
      // MOBILE MENU
      // ==========================================================

      function initializeMobileMenu() {
        const button = document.getElementById("mobileMenuButton");

        const menu = document.getElementById("mobileMenu");

        button.addEventListener("click", () => {
          const isOpen = !menu.classList.contains("hidden");

          if (isOpen) {
            menu.classList.add("hidden");
          } else {
            menu.classList.remove("hidden");
          }

          button.setAttribute("aria-expanded", String(!isOpen));
        });
      }

      // ==========================================================
      // TOAST NOTIFICATIONS
      // ==========================================================

      function showToast(message, type = "info") {
        const container = document.getElementById("toastContainer");

        const toast = document.createElement("div");

        toast.className =
          "toast pointer-events-auto rounded-xl border bg-white p-4 shadow-xl";

        let icon = "info";

        let iconClass = "text-brand";

        let borderClass = "border-stone-200";

        if (type === "success") {
          icon = "check-circle-2";

          iconClass = "text-success";

          borderClass = "border-green-100";
        } else if (type === "error") {
          icon = "alert-circle";

          iconClass = "text-error";

          borderClass = "border-red-100";
        }

        toast.classList.add(borderClass);

        toast.innerHTML = `

                <div class="flex items-start gap-3">

                    <div class="${iconClass} mt-0.5 shrink-0">

                        <i
                            data-lucide="${icon}"
                            class="h-5 w-5"
                        ></i>

                    </div>

                    <p class="flex-1 text-sm font-medium leading-6 text-ink">
                        ${escapeHtml(message)}
                    </p>

                    <button
                        type="button"
                        class="toast-close rounded-md p-1 text-stone-400 transition hover:bg-stone-100 hover:text-ink"
                        aria-label="Close notification"
                    >
                        <i
                            data-lucide="x"
                            class="h-4 w-4"
                        ></i>
                    </button>

                </div>

            `;

        container.appendChild(toast);

        lucide.createIcons();

        const removeToast = () => {
          toast.classList.add("hide");

          setTimeout(() => {
            toast.remove();
          }, 250);
        };

        toast
          .querySelector(".toast-close")
          ?.addEventListener("click", removeToast);

        setTimeout(removeToast, 4500);
      }

      // ==========================================================
      // HELPERS
      // ==========================================================

      function formatFileSize(bytes) {
        if (!bytes) {
          return "0 MB";
        }

        const units = ["Bytes", "KB", "MB", "GB"];

        const index = Math.floor(Math.log(bytes) / Math.log(1024));

        const value = bytes / Math.pow(1024, index);

        return `${value.toFixed(index >= 2 ? 1 : 0)} ${units[index]}`;
      }

      function formatDate(date) {
        const parsed = date instanceof Date ? date : new Date(date);

        if (Number.isNaN(parsed.getTime())) {
          return "Recently";
        }

        return parsed.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      }

      function escapeHtml(value) {
        return String(value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }

      function escapeAttribute(value) {
        return escapeHtml(value);
      }

      function resetUploadState(chapterId) {
        const chapter = chapters[chapterId];

        clearInterval(chapter.uploadTimer);

        chapter.uploading = false;

        chapter.progress = 0;

        chapter.pendingFile = null;

        chapter.uploadType = null;

        chapter.previousVideo = null;

        chapter.error = null;

        renderChapter(chapterId);

        updateOverallProgress();
      }