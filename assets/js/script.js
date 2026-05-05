(function($, window, document) {
  "use strict";

  var STORAGE_KEY = "taskmasterpro.tasks";
  var LEGACY_STORAGE_KEY = "tasks";
  var DATE_FORMAT = "L";
  var DUE_SOON_DAYS = 2;
  var AUDIT_INTERVAL_MS = 30 * 60 * 1000;
  var MAX_TASK_TEXT_LENGTH = 500;

  var TASK_STATUSES = ["toDo", "inProgress", "inReview", "done"];
  var DEFAULT_TASKS = Object.freeze({
    toDo: Object.freeze([]),
    inProgress: Object.freeze([]),
    inReview: Object.freeze([]),
    done: Object.freeze([])
  });

  var tasks = createEmptyTasks();

  function createEmptyTasks() {
    return TASK_STATUSES.reduce(function(taskMap, status) {
      taskMap[status] = [];
      return taskMap;
    }, {});
  }

  function normalizeTaskText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_TASK_TEXT_LENGTH);
  }

  function isValidTaskDate(value) {
    return moment(value, DATE_FORMAT, true).isValid();
  }

  function normalizeTaskDate(value) {
    var date = String(value || "").trim();
    return isValidTaskDate(date) ? date : "";
  }

  function normalizeTask(task) {
    if (!task || typeof task !== "object") {
      return null;
    }

    var text = normalizeTaskText(task.text);
    var date = normalizeTaskDate(task.date);

    if (!text || !date) {
      return null;
    }

    return {
      text: text,
      date: date
    };
  }

  function normalizeTaskCollection(rawTasks) {
    var normalized = createEmptyTasks();

    if (!rawTasks || typeof rawTasks !== "object" || Array.isArray(rawTasks)) {
      return normalized;
    }

    TASK_STATUSES.forEach(function(status) {
      if (!Array.isArray(rawTasks[status])) {
        return;
      }

      normalized[status] = rawTasks[status]
        .map(normalizeTask)
        .filter(Boolean);
    });

    return normalized;
  }

  function safeParseTasks(serializedTasks) {
    if (!serializedTasks) {
      return createEmptyTasks();
    }

    try {
      return normalizeTaskCollection(JSON.parse(serializedTasks));
    } catch (error) {
      console.warn("Taskmaster Pro ignored unreadable task data in localStorage.", error);
      return createEmptyTasks();
    }
  }

  function getStorageItem(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.warn("Taskmaster Pro could not read browser storage.", error);
      return null;
    }
  }

  function setStorageItem(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn("Taskmaster Pro could not save to browser storage.", error);
      return false;
    }
  }

  function readStoredTasks() {
    var currentTasks = getStorageItem(STORAGE_KEY);
    var legacyTasks = getStorageItem(LEGACY_STORAGE_KEY);
    var parsedTasks = safeParseTasks(currentTasks || legacyTasks);

    if (!currentTasks && legacyTasks) {
      setStorageItem(STORAGE_KEY, JSON.stringify(parsedTasks));
    }

    return parsedTasks;
  }

  function saveTasks() {
    setStorageItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function getStatusFromList(listEl) {
    return $(listEl).attr("id").replace("list-", "");
  }

  function getTaskDataFromList(listEl) {
    return $(listEl)
      .children(".list-group-item")
      .map(function() {
        return normalizeTask({
          text: $(this).find(".task-description").text(),
          date: $(this).find(".task-date").text()
        });
      })
      .get()
      .filter(Boolean);
  }

  function saveListTasks(listEl) {
    var status = getStatusFromList(listEl);

    if (!Object.prototype.hasOwnProperty.call(DEFAULT_TASKS, status)) {
      return;
    }

    tasks[status] = getTaskDataFromList(listEl);
    saveTasks();
  }

  function saveAllTaskLists() {
    TASK_STATUSES.forEach(function(status) {
      tasks[status] = getTaskDataFromList("#list-" + status);
    });

    saveTasks();
  }

  function syncTaskFromElement(taskEl) {
    var $task = $(taskEl);
    var status = getStatusFromList($task.closest(".list-group"));
    var index = $task.index();
    var task = normalizeTask({
      text: $task.find(".task-description").text(),
      date: $task.find(".task-date").text()
    });

    if (!task || !tasks[status] || !tasks[status][index]) {
      saveAllTaskLists();
      return;
    }

    tasks[status][index] = task;
    saveTasks();
  }

  function auditTask(taskEl) {
    var $task = $(taskEl);
    var date = $task.find(".task-date").text().trim();
    var dueDate = moment(date, DATE_FORMAT, true).set({ hour: 17, minute: 0, second: 0 });

    $task.removeClass("list-group-item-warning list-group-item-danger");

    if (!dueDate.isValid()) {
      return;
    }

    if (moment().isAfter(dueDate)) {
      $task.addClass("list-group-item-danger");
    } else if (dueDate.diff(moment(), "days") <= DUE_SOON_DAYS) {
      $task.addClass("list-group-item-warning");
    }
  }

  function createTask(taskText, taskDate, taskList) {
    var task = normalizeTask({ text: taskText, date: taskDate });

    if (!task || TASK_STATUSES.indexOf(taskList) === -1) {
      return null;
    }

    var $taskLi = $("<li>")
      .addClass("list-group-item task-card")
      .attr("tabindex", "0");
    var $taskDate = $("<span>")
      .addClass("badge badge-primary badge-pill task-date")
      .attr("aria-label", "Due date")
      .text(task.date);
    var $taskDescription = $("<p>")
      .addClass("m-1 task-description")
      .text(task.text);

    $taskLi.append($taskDate, $taskDescription);
    auditTask($taskLi);
    $("#list-" + taskList).append($taskLi);

    return task;
  }

  function loadTasks() {
    tasks = readStoredTasks();

    TASK_STATUSES.forEach(function(status) {
      tasks[status].forEach(function(task) {
        createTask(task.text, task.date, status);
      });
    });

    saveTasks();
  }

  function setFormFeedback(message) {
    $("#task-form-feedback").text(message || "").toggleClass("d-none", !message);
  }

  function clearTaskForm() {
    $("#modalTaskDescription, #modalDueDate").val("");
    setFormFeedback("");
  }

  function getEditedTaskContext(inputEl) {
    var $input = $(inputEl);
    var $task = $input.closest(".list-group-item");

    return {
      $input: $input,
      $task: $task,
      status: getStatusFromList($task.closest(".list-group")),
      index: $task.index()
    };
  }

  function replaceDescriptionEditor($editor, text) {
    var $taskDescription = $("<p>")
      .addClass("m-1 task-description")
      .text(text);

    $editor.replaceWith($taskDescription);
  }

  function replaceDateEditor($editor, date) {
    var $taskDate = $("<span>")
      .addClass("badge badge-primary badge-pill task-date")
      .attr("aria-label", "Due date")
      .text(date);

    $editor.replaceWith($taskDate);
    auditTask($taskDate.closest(".list-group-item"));
  }

  function initializeDragAndDrop() {
    $(".card .list-group").sortable({
      connectWith: $(".card .list-group"),
      scroll: false,
      tolerance: "pointer",
      helper: "clone",
      activate: function() {
        $(this).addClass("dropover");
        $(".bottom-trash").addClass("bottom-trash-drag");
      },
      deactivate: function() {
        $(this).removeClass("dropover");
        $(".bottom-trash").removeClass("bottom-trash-drag");
      },
      over: function(event) {
        $(event.target).addClass("dropover-active");
      },
      out: function(event) {
        $(event.target).removeClass("dropover-active");
      },
      update: function() {
        saveAllTaskLists();
      }
    });

    $("#trash").droppable({
      accept: ".card .list-group-item",
      tolerance: "touch",
      drop: function(event, ui) {
        ui.draggable.remove();
        $(".bottom-trash").removeClass("bottom-trash-active");
        saveAllTaskLists();
      },
      over: function() {
        $(".bottom-trash").addClass("bottom-trash-active");
      },
      out: function() {
        $(".bottom-trash").removeClass("bottom-trash-active");
      }
    });
  }

  function initializeDatePickers() {
    $("#modalDueDate").datepicker({
      minDate: 1
    });
  }

  function initializeTaskForm() {
    $("#task-form-modal").on("show.bs.modal", clearTaskForm);

    $("#task-form-modal").on("shown.bs.modal", function() {
      $("#modalTaskDescription").trigger("focus");
    });

    $("#task-form").on("submit", function(event) {
      event.preventDefault();

      var taskText = normalizeTaskText($("#modalTaskDescription").val());
      var taskDate = normalizeTaskDate($("#modalDueDate").val());
      var task = normalizeTask({ text: taskText, date: taskDate });

      if (!task) {
        setFormFeedback("Please enter a task description and choose a valid due date.");
        return;
      }

      createTask(task.text, task.date, "toDo");
      tasks.toDo.push(task);
      saveTasks();
      $("#task-form-modal").modal("hide");
    });
  }

  function initializeInlineEditing() {
    $(".list-group").on("click", ".task-description", function() {
      var text = $(this).text().trim();
      var $textInput = $("<textarea>")
        .addClass("form-control task-description-input")
        .attr({
          "aria-label": "Edit task description",
          maxlength: MAX_TASK_TEXT_LENGTH
        })
        .val(text);

      $(this).replaceWith($textInput);
      $textInput.trigger("focus");
    });

    $(".list-group").on("blur", ".task-description-input", function() {
      var context = getEditedTaskContext(this);
      var previousText = tasks[context.status] && tasks[context.status][context.index]
        ? tasks[context.status][context.index].text
        : "";
      var text = normalizeTaskText(context.$input.val()) || previousText;

      replaceDescriptionEditor(context.$input, text);
      syncTaskFromElement(context.$task);
    });

    $(".list-group").on("click", ".task-date", function() {
      var date = $(this).text().trim();
      var $dateInput = $("<input>")
        .attr({
          type: "text",
          "aria-label": "Edit due date",
          autocomplete: "off"
        })
        .addClass("form-control task-date-input")
        .val(date);

      $(this).replaceWith($dateInput);

      $dateInput.datepicker({
        minDate: 1,
        onClose: function() {
          $(this).trigger("change");
        }
      });

      $dateInput.trigger("focus");
    });

    $(".list-group").on("change", ".task-date-input", function() {
      var context = getEditedTaskContext(this);
      var previousDate = tasks[context.status] && tasks[context.status][context.index]
        ? tasks[context.status][context.index].date
        : "";
      var date = normalizeTaskDate(context.$input.val()) || previousDate;

      replaceDateEditor(context.$input, date);
      syncTaskFromElement(context.$task);
    });
  }

  function initializeBulkActions() {
    $("#remove-tasks").on("click", function() {
      if (!window.confirm("Delete all saved tasks? This cannot be undone.")) {
        return;
      }

      tasks = createEmptyTasks();
      TASK_STATUSES.forEach(function(status) {
        $("#list-" + status).empty();
      });
      saveTasks();
    });
  }

  function initializeAuditing() {
    window.setInterval(function() {
      $(".card .list-group-item").each(function() {
        auditTask(this);
      });
    }, AUDIT_INTERVAL_MS);
  }

  $(function() {
    initializeDragAndDrop();
    initializeDatePickers();
    initializeTaskForm();
    initializeInlineEditing();
    initializeBulkActions();
    loadTasks();
    initializeAuditing();
  });
})(jQuery, window, document);
