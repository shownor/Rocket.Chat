Meteor.methods({
	addUsersToRoom: function(data) {
		var ref, room, user, userId, userInRoom, canAddUser;

		// Validate user and room
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'addUsersToRoom'
			});
		}
		if (!Match.test(data != null ? data.rid : void 0, String)) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'addUsersToRoom'
			});
		}

		// Get user and room details
		room = RocketChat.models.Rooms.findOneById(data.rid);
		userId = Meteor.userId();
		user = Meteor.user();
		userInRoom = ((ref = room.usernames) != null ? ref.indexOf(user.username) : void 0) >= 0;

		// Can't add to direct room ever
		if (room.t === 'd') {
			throw new Meteor.Error('error-cant-invite-for-direct-room', 'Can\'t invite user to direct rooms', {
				method: 'addUsersToRoom'
			});
		}

		// Can add to any room you're in, with permission, otherwise need specific room type permission
		canAddUser = false;
		if (userInRoom && RocketChat.authz.hasPermission(userId, 'add-user-to-joined-room', room._id)) {
			canAddUser = true;
		} else if (room.t === 'c' && RocketChat.authz.hasPermission(userId, 'add-user-to-any-c-room')) {
			canAddUser = true;
		} else if (room.t === 'p' && RocketChat.authz.hasPermission(userId, 'add-user-to-any-p-room')) {
			canAddUser = true;
		}

		// Adding wasn't allowed
		if (!canAddUser) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'addUsersToRoom'
			});
		}

		// Missing the users to be added
		if (!Array.isArray(data.users)) {
			throw new Meteor.Error('error-invalid-arguments', 'Invalid arguments', {
				method: 'addUsersToRoom'
			});
		}

		// Validate each user, then add to room
		data.users.forEach(function(username) {
			let newUser = RocketChat.models.Users.findOneByUsername(username);
			if (newUser == null) {
				throw new Meteor.Error('error-invalid-username', 'Invalid username', {
					method: 'addUsersToRoom'
				});
			}
			RocketChat.addUserToRoom(data.rid, newUser, user);
		});

		return true;

	}
});