package com.letsgo.devcommunity.domain.post.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class TagPostMap {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long tagId;
    private Long postId;

    public TagPostMap(Long tagId, Long postId) {
        this.tagId = tagId;
        this.postId = postId;
    }

    public TagPostMap() {
    }
}
